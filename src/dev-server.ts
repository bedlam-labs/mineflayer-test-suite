// @ts-nocheck
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { createMCServer } from 'flying-squid';
import mineflayer from 'mineflayer';
import { Vec3 } from 'vec3';
import type { DevServerOptions, WorldLayout } from './types';
import { PrismarinePathVisualizer } from './visualization/PrismarinePathVisualizer';

const { mineflayer: startMineflayerViewer } = require('@aidentran900/prismarine-viewer');

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

const UI_DIST = path.resolve(__dirname, '../ui/dist');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.svg':  'image/svg+xml',
  '.json': 'application/json',
  '.png':  'image/png',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function serveStatic(res: http.ServerResponse, urlPath: string): boolean {
  const safePath = urlPath === '/' ? '/index.html' : urlPath;
  const filePath = path.join(UI_DIST, safePath);
  if (!filePath.startsWith(UI_DIST)) {
    res.writeHead(403).end();
    return true;
  }
  try {
    const data = fs.readFileSync(filePath);
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' }).end(data);
    return true;
  } catch {
    return false;
  }
}

const sseClients: http.ServerResponse[] = [];

function broadcast(data: string) {
  data.replace(/\r\n/g, '\n').split('\n').filter(Boolean)
    .forEach(line => sseClients.forEach(c => c.write(`data: ${line}\n\n`)));
}

function broadcastEvent(name: string) {
  sseClients.forEach(c => c.write(`event: ${name}\ndata:\n\n`));
}

interface TestEntry { suite: string; file: string; name: string }

function scanTests(dir: string): TestEntry[] {
  const results: TestEntry[] = [];
  const integrationDir = path.join(dir, '__tests__', 'integration');

  let entries;
  try { entries = fs.readdirSync(integrationDir, { withFileTypes: true }); }
  catch { return results; }

  for (const entry of entries) {
    if (entry.isDirectory() || !/\.test\.[jt]s$/.test(entry.name)) continue;
    const content = fs.readFileSync(path.join(integrationDir, entry.name), 'utf-8');
    const pattern = /(?:^|\s)(?:it|test)\s*\(\s*['"`](.*?)['"`]/gm;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      results.push({ suite: 'integration', file: entry.name, name: match[1] });
    }
  }

  return results;
}

export function startDevServer(options: DevServerOptions) {
  const {
    port,
    viewerPort = port + 1000,
    adminPort  = port + 2000,
    version    = '1.8.8',
    viewDistance = 4,
    cwd: projectCwd,
    testRunner,
  } = options;

  const mcData = require('minecraft-data')(version);
  const PBlock = require('prismarine-block')(version);

  let activeTest: ChildProcess | null = null;

  function runTest(suite: string, testName?: string): boolean {
    if (activeTest) return false;
    const { script, cwd, env: extraEnv } = testRunner(suite);
    const label = testName ? `${script} -t "${testName}"` : script;
    broadcast(`\n$ npm run ${label}\n\n`);
    const spawnArgs = testName
      ? ['run', script, '--', '--testNamePattern', testName]
      : ['run', script];
    activeTest = spawn('npm', spawnArgs, {
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

  server.once('listening', async () => {
    console.log(`[server] port ${port}`);

    server.spawnPoint = new Vec3(0, 5, 0);

    http.createServer((req, res) => {
      const url = req.url ?? '/';

      if (req.method === 'GET' && url === '/api/config') {
        res.writeHead(200, { 'Content-Type': 'application/json' }).end(
          JSON.stringify({ viewerPort, adminPort, port })
        );

      } else if (req.method === 'GET' && url === '/api/tests') {
        const tests = projectCwd ? scanTests(projectCwd) : [];
        res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(tests));

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

      } else if (req.method === 'POST' && url === '/visualize') {
        let body = '';
        req.on('data', (d: Buffer) => { body += d; });
        req.on('end', () => {
          try {
            const payload = JSON.parse(body);
            if (payload.clear) {
              pathVisualizer?.clear();
            } else if (payload.nodes) {
              pathVisualizer?.renderPath(payload.nodes);
            }
            res.writeHead(200).end('ok');
          } catch (err: any) {
            res.writeHead(400).end(err.message);
          }
        });

      } else if (req.method === 'POST' && url.startsWith('/run/')) {
        const parsed = new URL(url, 'http://localhost');
        const suite = parsed.pathname.slice(5);
        const testName = parsed.searchParams.get('test') ?? undefined;
        res.writeHead(runTest(suite, testName) ? 200 : 409).end();

      } else if (req.method === 'GET') {
        if (!serveStatic(res, url)) {
          serveStatic(res, '/');
        }
      } else {
        res.writeHead(404).end();
      }
    }).listen(adminPort, () => {
      console.log(`[panel] http://localhost:${adminPort}`);
    });

    const observerBot = mineflayer.createBot({
      host: 'localhost', port, username: 'Observer', version, auth: 'offline',
    });

    let pathVisualizer: PrismarinePathVisualizer | null = null;

    observerBot.once('spawn', () => {
      startMineflayerViewer(observerBot, { port: viewerPort, firstPerson: false, viewDistance });
      pathVisualizer = new PrismarinePathVisualizer(observerBot);
      console.log(`[viewer] http://localhost:${viewerPort}`);

      const observer = Object.values(server.players).find((p: any) => p.username === 'Observer') as any;
      if (observer) observer.teleport(new Vec3(8, 20, 8));
    });
  });

  process.on('SIGINT', () => { server.quit(); process.exit(0); });

  return server;
}
