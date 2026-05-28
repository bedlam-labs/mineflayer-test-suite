// @ts-nocheck
import * as http from 'http';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { createMCServer } from 'flying-squid';
import mineflayer from 'mineflayer';
import { Vec3 } from 'vec3';
import type { DevServerOptions, WorldLayout } from './types';

const { mineflayer: startMineflayerViewer } = require('prismarine-viewer');

let dirtyPositions: Array<{ x: number; y: number; z: number }> = [];

function stateIdOf(mcData: any, PBlock: any, blockName: string): number {
  const info = mcData.blocksByName[blockName];
  return new PBlock(info.id, 0, 0).stateId ?? (info.id << 4);
}

async function applyLayout(
  server: any,
  world: any,
  layout: WorldLayout,
  mcData: any,
  PBlock: any
) {
  const touched = new Set<string>();
  const note = (x: number, _y: number, z: number) => touched.add(`${x >> 4},${z >> 4}`);

  await Promise.all(dirtyPositions.map(p => {
    note(p.x, p.y, p.z);
    return world.setBlockStateId(new Vec3(p.x, p.y, p.z), 0);
  }));
  dirtyPositions = [];

  for (const region of layout.fillRegions) {
    const sid = stateIdOf(mcData, PBlock, region.block);
    const ops = [];
    for (let x = region.min.x; x <= region.max.x; x++)
      for (let y = region.min.y; y <= region.max.y; y++)
        for (let z = region.min.z; z <= region.max.z; z++) {
          ops.push(world.setBlockStateId(new Vec3(x, y, z), sid));
          note(x, y, z);
          if (region.block !== 'air') dirtyPositions.push({ x, y, z });
        }
    await Promise.all(ops);
  }

  await Promise.all(layout.placedBlocks.map(({ pos, block }) => {
    note(pos.x, pos.y, pos.z);
    dirtyPositions.push(pos);
    return world.setBlockStateId(new Vec3(pos.x, pos.y, pos.z), stateIdOf(mcData, PBlock, block));
  }));

  const chunks = Array.from(touched).map(k => {
    const [cx, cz] = k.split(',').map(Number);
    return { chunkX: cx, chunkZ: cz };
  });
  for (const oPlayer of (server as any).players.filter((p: any) => p.world === world)) {
    for (const { chunkX, chunkZ } of chunks) {
      if (oPlayer.loadedChunks[`${chunkX},${chunkZ}`] !== undefined) {
        oPlayer._unloadChunk(chunkX, chunkZ);
      }
    }
    oPlayer.worldSendRestOfChunks();
  }
}

function buildPanelHtml(viewerPort: number): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Mineflayer Tests</title>
  <style>
    *{box-sizing:border-box}
    body{margin:0;font-family:monospace;background:#141414;color:#ddd;display:flex;flex-direction:column;height:100vh;padding:14px;gap:10px}
    h1{margin:0;font-size:14px;color:#666}
    h1 a{color:#444;text-decoration:none}h1 a:hover{color:#888}
    .row{display:flex;gap:8px;flex-wrap:wrap}
    button{background:#222;color:#ccc;border:1px solid #444;padding:7px 14px;cursor:pointer;border-radius:3px;font-family:monospace;font-size:12px;transition:border-color .15s}
    button:hover:not(:disabled){background:#2a2a2a;border-color:#777}
    button:disabled{opacity:.4;cursor:default}
    button.running{border-color:#e8a020;color:#e8a020}
    #output{flex:1;overflow-y:auto;background:#0d0d0d;padding:12px;border-radius:3px;border:1px solid #2a2a2a;white-space:pre-wrap;font-size:12px;line-height:1.5}
  </style>
</head>
<body>
  <h1>Mineflayer Tests &nbsp;·&nbsp; <a href="http://localhost:${viewerPort}" target="_blank">viewer :${viewerPort}</a></h1>
  <div class="row">
    <button id="b-integration" onclick="run('integration')">All Tests</button>
    <button id="b-reset" onclick="reset()" style="margin-left:auto;color:#555;border-color:#333">Reset World</button>
  </div>
  <pre id="output">Ready.</pre>
  <script>
    const out = document.getElementById('output');
    let running = null;
    const TEST_BTNS = ['b-integration'];
    const es = new EventSource('/events');
    es.onmessage = e => { out.textContent += e.data + '\\n'; out.scrollTop = out.scrollHeight; };
    es.addEventListener('done', () => {
      TEST_BTNS.forEach(id => { const b = document.getElementById(id); b.disabled = false; b.classList.remove('running'); });
      running = null;
    });
    function run(suite) {
      if (running) return;
      running = suite;
      out.textContent = '';
      TEST_BTNS.forEach(id => document.getElementById(id).disabled = true);
      document.getElementById('b-' + suite).classList.add('running');
      fetch('/run/' + suite, { method: 'POST' });
    }
    function reset() {
      fetch('/reset', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({fillRegions:[],placedBlocks:[],spawnPoint:{x:0,y:1,z:0}}) })
        .then(() => out.textContent += '\\n[reset] world cleared\\n');
    }
  </script>
</body>
</html>`;
}

const sseClients: http.ServerResponse[] = [];

function broadcast(data: string) {
  data.replace(/\r\n/g, '\n').split('\n').filter(Boolean)
    .forEach(line => sseClients.forEach(c => c.write(`data: ${line}\n\n`)));
}

function broadcastEvent(name: string) {
  sseClients.forEach(c => c.write(`event: ${name}\ndata:\n\n`));
}

export function startDevServer(options: DevServerOptions) {
  const {
    port,
    viewerPort = port + 1000,
    adminPort  = port + 2000,
    version    = '1.8.8',
    viewDistance = 4,
    testRunner,
  } = options;

  const mcData = require('minecraft-data')(version);
  const PBlock = require('prismarine-block')(version);

  let activeTest: ChildProcess | null = null;

  function runTest(suite: string): boolean {
    if (activeTest) return false;
    const { script, cwd, env: extraEnv } = testRunner(suite);
    broadcast(`\n$ npm run ${script}\n\n`);
    activeTest = spawn('npm', ['run', script], {
      cwd,
      env: { ...process.env, TEST_SERVER_PORT: String(port), ...extraEnv },
      shell: true,
    });
    activeTest.stdout.on('data', (d: Buffer) => broadcast(d.toString()));
    activeTest.stderr.on('data', (d: Buffer) => broadcast(d.toString()));
    activeTest.on('close', (code: number) => {
      broadcast(`\n[done] exit code ${code}\n`);
      broadcastEvent('done');
      activeTest = null;
    });
    return true;
  }

  const voidGenPath = path.resolve(__dirname, '../void-generator.js');
  const server = createMCServer({
    'online-mode': false,
    version,
    logging:       true,
    plugins:       {},
    'view-distance': viewDistance,
    'max-players':   10,
    gameMode:        1,
    'player-list-text': { header: '', footer: '' },
    generation:    { name: voidGenPath, options: { seed: 0 } },
    port,
  });

  server.once('pluginsReady', () => {
    server.getSpawnPoint = async () => server.spawnPoint;
  });

  const panelHtml = buildPanelHtml(viewerPort);

  server.once('listening', async () => {
    console.log(`[server] port ${port}`);

    server.spawnPoint = new Vec3(0, 5, 0);

    http.createServer((req, res) => {
      const url = req.url ?? '/';

      if (req.method === 'GET' && url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' }).end(panelHtml);

      } else if (req.method === 'GET' && url === '/events') {
        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
        sseClients.push(res);
        req.on('close', () => { const i = sseClients.indexOf(res); if (i >= 0) sseClients.splice(i, 1); });

      } else if (req.method === 'POST' && url === '/reset') {
        let body = '';
        req.on('data', (d: Buffer) => { body += d; });
        req.on('end', async () => {
          try {
            const layout = JSON.parse(body);
            const regionCount = layout.fillRegions?.length ?? 0;
            const placedCount = layout.placedBlocks?.length ?? 0;
            console.log(`[reset] layout: ${regionCount} regions, ${placedCount} placed, spawn=(${layout.spawnPoint?.x},${layout.spawnPoint?.y},${layout.spawnPoint?.z})`);
            broadcast(`[reset] ${regionCount} regions, ${placedCount} blocks\n`);
            await applyLayout(server, server.overworld, layout, mcData, PBlock);
            server.spawnPoint = new Vec3(layout.spawnPoint.x, layout.spawnPoint.y, layout.spawnPoint.z);
            for (const player of Object.values(server.players)) {
              if ((player as any).username === 'Observer') continue;
              (player as any).teleport(server.spawnPoint);
            }
            console.log(`[reset] applied OK`);
            res.writeHead(200).end('ok');
          } catch (err: any) {
            console.error(`[reset] error:`, err);
            res.writeHead(400).end(err.message);
          }
        });

      } else if (req.method === 'POST' && url.startsWith('/run/')) {
        const suite = url.slice(5);
        res.writeHead(runTest(suite) ? 200 : 409).end();

      } else {
        res.writeHead(404).end();
      }
    }).listen(adminPort, () => {
      console.log(`[panel] http://localhost:${adminPort}`);
    });

    const observerBot = mineflayer.createBot({
      host: 'localhost', port, username: 'Observer', version, auth: 'offline',
    });

    observerBot.once('spawn', () => {
      startMineflayerViewer(observerBot, { port: viewerPort, firstPerson: false, viewDistance });
      console.log(`[viewer] http://localhost:${viewerPort}`);

      const observer = Object.values(server.players).find((p: any) => p.username === 'Observer') as any;
      if (observer) observer.teleport(new Vec3(8, 20, 8));
    });
  });

  process.on('SIGINT', () => { server.quit(); process.exit(0); });

  return server;
}
