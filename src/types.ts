import type { Bot } from 'mineflayer';

export interface WorldLayout {
  spawnPoint: { x: number; y: number; z: number };
  fillRegions: Array<{
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
    block: string;
  }>;
  placedBlocks: Array<{
    pos: { x: number; y: number; z: number };
    block: string;
  }>;
}

export interface TestEnv {
  bot: Bot;
  visualizer: PathVisualizer;
  teardown: () => Promise<void>;
}

export interface NeoMeta {
  pillarX: number;
  pillarZ: number;
  strafe: 'left' | 'right';
}

export interface PathNode {
  x: number;
  y: number;
  z: number;
  neo?: NeoMeta;
}

export interface PathVisualizer {
  renderPath(nodes: PathNode[]): void;
  clear(): void;
}

export interface ClientVisualizer {
  drawLine(id: string, points: { x: number; y: number; z: number }[], color?: number): void;
  drawBox(id: string, start: { x: number; y: number; z: number }, end: { x: number; y: number; z: number }, color?: number): void;
  drawSphere(id: string, position: { x: number; y: number; z: number }, radius?: number, color?: number): void;
  drawPoints(id: string, points: { x: number; y: number; z: number }[], color?: number, size?: number): void;
  drawText(id: string, position: { x: number; y: number; z: number }, text: string, color?: string): void;
  erase(id: string): void;
  clear(): void;
}

export interface SetupOptions {
  port: number;
  layout: WorldLayout;
  version?: string;
  plugins?: Array<(bot: Bot) => void>;
  viewDistance?: number;
}

export interface DevServerOptions {
  port: number;
  viewerPort?: number;
  adminPort?: number;
  version?: string;
  viewDistance?: number;
  cwd?: string;
  testRunner: (suite: string) => { script: string; cwd: string; env?: Record<string, string> };
}

export const DEFAULT_SPAWN = { x: 0, y: 5, z: 0 };
