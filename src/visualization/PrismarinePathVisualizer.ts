import type { Bot } from 'mineflayer';
import { Vec3 } from 'vec3';
import type { PathNode, PathVisualizer } from '../types';

type ViewerBot = Bot & {
  viewer?: {
    drawLine(id: string, points: Vec3[], color?: number): void;
    erase(id: string): void;
  };
};

export class PrismarinePathVisualizer implements PathVisualizer {
  constructor(private readonly bot: ViewerBot) {}

  renderPath(nodes: PathNode[]): void {
    if (!this.bot.viewer) return;

    const toPoint = (n: PathNode) => new Vec3(n.x + 0.5, n.y + 0.5, n.z + 0.5);

    this.bot.viewer.drawLine('viz-path', nodes.map(toPoint), 0x00aaff);

    const neoNodes = nodes.filter(n => n.neo);
    if (neoNodes.length > 0) {
      this.bot.viewer.drawLine('viz-neo', neoNodes.map(toPoint), 0xff8800);
    } else {
      this.bot.viewer.erase('viz-neo');
    }
  }

  clear(): void {
    this.bot.viewer?.erase('viz-path');
    this.bot.viewer?.erase('viz-neo');
  }
}
