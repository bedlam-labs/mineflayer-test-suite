import * as http from 'http';
import { createMCServer } from 'flying-squid';
import mineflayer, { Bot } from 'mineflayer';
import { NullPathVisualizer } from './visualization/PathVisualizer';
import { RemotePathVisualizer } from './visualization/RemotePathVisualizer';
import type { PathVisualizer, SetupOptions, TestEnv, WorldLayout } from './types';

const SERVER_DEFAULTS = {
  'online-mode': false,
  version:       '1.8.8',
  logging:       false,
  plugins:       {},
  'view-distance': 3,
  'max-players':   4,
  gameMode:        1,
  'player-list-text': { header: '', footer: '' },
};

function postLayout(adminPort: number, layout: WorldLayout): Promise<void> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(layout);
    const req  = http.request(
      { hostname: 'localhost', port: adminPort, path: '/reset', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
      res => { res.resume(); res.on('end', resolve); }
    );
    req.on('error', reject);
    req.end(body);
  });
}

async function applyLayoutStandalone(world: any, layout: WorldLayout, version: string) {
  const mcData = require('minecraft-data')(version);
  const PBlock = require('prismarine-block')(version);
  const { Vec3 } = require('vec3');

  const sidOf = (name: string): number => {
    const info = mcData.blocksByName[name];
    return new PBlock(info.id, 0, 0).stateId ?? (info.id << 4);
  };

  for (const region of layout.fillRegions) {
    const sid = sidOf(region.block);
    const ops = [];
    for (let x = region.min.x; x <= region.max.x; x++)
      for (let y = region.min.y; y <= region.max.y; y++)
        for (let z = region.min.z; z <= region.max.z; z++)
          ops.push(world.setBlockStateId(new Vec3(x, y, z), sid));
    await Promise.all(ops);
  }
  await Promise.all(layout.placedBlocks.map(({ pos, block }: any) =>
    world.setBlockStateId(new Vec3(pos.x, pos.y, pos.z), sidOf(block))
  ));
}

export async function setup(options: SetupOptions): Promise<TestEnv> {
  const { port, layout, version = '1.8.8', plugins = [], viewDistance = 2 } = options;

  const externalPort = process.env.TEST_SERVER_PORT
    ? Number(process.env.TEST_SERVER_PORT)
    : null;

  let stopServer: (() => void) | null = null;

  if (externalPort) {
    await postLayout(externalPort + 2000, layout);
  } else {
    const voidGenPath = require('path').resolve(__dirname, '../void-generator.js');
    const server = createMCServer({
      ...SERVER_DEFAULTS,
      port,
      version,
      'view-distance': viewDistance,
      generation: { name: voidGenPath, options: { seed: 0 } },
    }) as any;
    server.once('pluginsReady', () => {
      server.getSpawnPoint = async () => server.spawnPoint;
    });
    await new Promise<void>(resolve => server.once('listening', resolve));
    const { Vec3 } = require('vec3');
    server.spawnPoint = new Vec3(layout.spawnPoint.x, layout.spawnPoint.y, layout.spawnPoint.z);
    await applyLayoutStandalone(server.overworld, layout, version);
    stopServer = () => server.quit();
  }

  const connectPort = externalPort ?? port;
  const bot = mineflayer.createBot({
    host: 'localhost', port: connectPort, username: 'Test', version, auth: 'offline',
  });

  for (const plugin of plugins) {
    bot.loadPlugin(plugin);
  }

  await new Promise<void>((resolve, reject) => {
    bot.once('spawn', resolve);
    bot.once('error', reject);
    setTimeout(() => reject(new Error('spawn timeout')), 15_000);
  });

  let visualizer: PathVisualizer = new NullPathVisualizer();

  if (externalPort) {
    visualizer = new RemotePathVisualizer(externalPort + 2000);
  }

  (bot as any).on('path_update', (update: { path: Array<{ x: number; y: number; z: number; neo?: unknown }> }) => {
    visualizer.renderPath(update.path as Parameters<PathVisualizer['renderPath']>[0]);
  });

  return {
    bot,
    visualizer,
    teardown: async () => {
      await new Promise<void>(resolve => {
        bot.once('end', () => resolve());
        bot.quit();
        stopServer?.();
      });
    },
  };
}

export function waitForCondition(
  condition: () => boolean,
  intervalMs = 50,
  timeoutMs  = 10_000
): Promise<void> {
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      if (condition()) { clearInterval(interval); clearTimeout(timeout); resolve(); }
    }, intervalMs);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      reject(new Error('condition timed out'));
    }, timeoutMs);
  });
}
