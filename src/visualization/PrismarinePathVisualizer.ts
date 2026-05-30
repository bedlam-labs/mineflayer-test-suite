import type { Bot } from 'mineflayer';
import { Vec3 } from 'vec3';
import type { PathNode, PathVisualizer } from '../types';

type ViewerBot = Bot & {
  viewer?: {
    drawLine(id: string, points: Vec3[], color?: number): void;
    drawPoints(id: string, points: Vec3[], color?: number, size?: number): void;
    erase(id: string): void;
  };
};

export class PrismarinePathVisualizer implements PathVisualizer {
  constructor(private readonly bot: ViewerBot) {}

  renderPath(nodes: PathNode[]): void {
    if (!this.bot.viewer) return;

    const toPoint = (n: PathNode) => new Vec3(n.x + 0.5, n.y + 0.5, n.z + 0.5);
    const points = nodes.map(toPoint);

    this.bot.viewer.drawLine('viz-path', points, 0x00aaff);
    this.bot.viewer.drawPoints('viz-nodes', points, 0xffff00, 5);

    const neoNodes = nodes.filter(n => n.neo);
    if (neoNodes.length > 0) {
      const neoPoints = neoNodes.map(toPoint);
      this.bot.viewer.drawLine('viz-neo', neoPoints, 0xff8800);
      this.bot.viewer.drawPoints('viz-neo-nodes', neoPoints, 0xff4400, 8);
    } else {
      this.bot.viewer.erase('viz-neo');
      this.bot.viewer.erase('viz-neo-nodes');
    }
  }

  clear(): void {
    this.bot.viewer?.erase('viz-path');
    this.bot.viewer?.erase('viz-nodes');
    this.bot.viewer?.erase('viz-neo');
    this.bot.viewer?.erase('viz-neo-nodes');
  }
}
