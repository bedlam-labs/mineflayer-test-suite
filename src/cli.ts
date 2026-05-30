#!/usr/bin/env node
import * as path from 'path';
import { startDevServer } from './dev-server';

function parseArgs(argv: string[]): { port: number; cwd: string; viewDistance: number } {
  let port = 25600;
  let cwd = process.cwd();
  let viewDistance = 4;

  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--port' && argv[i + 1]) {
      port = Number(argv[++i]);
    } else if (argv[i] === '--cwd' && argv[i + 1]) {
      cwd = path.resolve(argv[++i]);
    } else if (argv[i] === '--view-distance' && argv[i + 1]) {
      viewDistance = Number(argv[++i]);
    }
  }

  return { port, cwd, viewDistance };
}

const { port, cwd, viewDistance } = parseArgs(process.argv);

startDevServer({
  port,
  viewDistance,
  cwd,
  testRunner: (suite) => ({
    script: suite === 'integration' ? 'test:integration' : `test:${suite}`,
    cwd,
  }),
});
