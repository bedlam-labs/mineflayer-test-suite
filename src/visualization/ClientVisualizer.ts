import type { Bot } from 'mineflayer';
import type { ClientVisualizer } from '../types';

type Point3 = { x: number; y: number; z: number };

type ViewerBot = Bot & {
  viewer?: {
    drawLine(id: string, points: Point3[], color?: number): void;
    drawBox(id: string, start: Point3, end: Point3, color?: number): void;
    drawSphere(id: string, position: Point3, radius?: number, color?: number): void;
    drawPoints(id: string, points: Point3[], color?: number, size?: number): void;
    drawText(id: string, position: Point3, text: string, color?: string): void;
    erase(id: string): void;
  };
};

export class PrismarineClientVisualizer implements ClientVisualizer {
  private readonly trackedIds = new Set<string>();

  constructor(private readonly bot: ViewerBot) {}

  drawLine(id: string, points: Point3[], color = 0x00aaff): void {
    if (!this.bot.viewer) return;
    this.trackedIds.add(id);
    this.bot.viewer.drawLine(id, points, color);
  }

  drawBox(id: string, start: Point3, end: Point3, color = 0x00ff00): void {
    if (!this.bot.viewer) return;
    this.trackedIds.add(id);
    this.bot.viewer.drawBox(id, start, end, color);
  }

  drawSphere(id: string, position: Point3, radius = 0.5, color = 0xff00ff): void {
    if (!this.bot.viewer) return;
    this.trackedIds.add(id);
    this.bot.viewer.drawSphere(id, position, radius, color);
  }

  drawPoints(id: string, points: Point3[], color = 0xffff00, size = 5): void {
    if (!this.bot.viewer) return;
    this.trackedIds.add(id);
    this.bot.viewer.drawPoints(id, points, color, size);
  }

  drawText(id: string, position: Point3, text: string, color = '#ffffff'): void {
    if (!this.bot.viewer) return;
    this.trackedIds.add(id);
    this.bot.viewer.drawText(id, position, text, color);
  }

  erase(id: string): void {
    this.bot.viewer?.erase(id);
    this.trackedIds.delete(id);
  }

  clear(): void {
    for (const id of this.trackedIds) {
      this.bot.viewer?.erase(id);
    }
    this.trackedIds.clear();
  }
}

export class NullClientVisualizer implements ClientVisualizer {
  drawLine(_id: string, _points: Point3[], _color?: number): void {}
  drawBox(_id: string, _start: Point3, _end: Point3, _color?: number): void {}
  drawSphere(_id: string, _position: Point3, _radius?: number, _color?: number): void {}
  drawPoints(_id: string, _points: Point3[], _color?: number, _size?: number): void {}
  drawText(_id: string, _position: Point3, _text: string, _color?: string): void {}
  erase(_id: string): void {}
  clear(): void {}
}
