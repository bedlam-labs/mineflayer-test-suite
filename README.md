# mineflayer-test-suite

Testing suite library for mineflayer bots. Provides integration test infrastructure, world layout management, visualization, and a dev server with browser-based control panel.

## Usage

```ts
import { setup, waitForCondition } from 'mineflayer-test-suite';
import type { WorldLayout } from 'mineflayer-test-suite';

const layout: WorldLayout = {
  spawnPoint: { x: 0, y: 5, z: 0 },
  fillRegions: [
    { min: { x: -2, y: 4, z: -2 }, max: { x: 2, y: 4, z: 2 }, block: 'stone' },
  ],
  placedBlocks: [],
};

const env = await setup({ port: 25610, layout });

// use env.bot ...

await env.teardown();
```

### Dev Server

```ts
import { startDevServer } from 'mineflayer-test-suite';

startDevServer({
  port: 25600,
  testRunner: (suite) => ({
    script: suite === 'integration' ? 'test:integration' : `test:${suite}`,
    cwd: '/path/to/project',
  }),
});
```

## Exports

- `setup(options)` — spawn MC server + bot, return `TestEnv`
- `waitForCondition(fn, interval?, timeout?)` — poll until condition true
- `startDevServer(options)` — launch dev server with admin panel + viewer
- `NullPathVisualizer` / `PrismarinePathVisualizer` — path visualization
- Types: `WorldLayout`, `TestEnv`, `PathNode`, `NeoMeta`, `PathVisualizer`, `SetupOptions`, `DevServerOptions`
