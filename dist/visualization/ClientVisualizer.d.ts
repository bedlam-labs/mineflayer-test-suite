import type { Bot } from 'mineflayer';
import type { ClientVisualizer } from '../types';
type Point3 = {
    x: number;
    y: number;
    z: number;
};
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
export declare class PrismarineClientVisualizer implements ClientVisualizer {
    private readonly bot;
    private readonly trackedIds;
    constructor(bot: ViewerBot);
    drawLine(id: string, points: Point3[], color?: number): void;
    drawBox(id: string, start: Point3, end: Point3, color?: number): void;
    drawSphere(id: string, position: Point3, radius?: number, color?: number): void;
    drawPoints(id: string, points: Point3[], color?: number, size?: number): void;
    drawText(id: string, position: Point3, text: string, color?: string): void;
    erase(id: string): void;
    clear(): void;
}
export declare class NullClientVisualizer implements ClientVisualizer {
    drawLine(_id: string, _points: Point3[], _color?: number): void;
    drawBox(_id: string, _start: Point3, _end: Point3, _color?: number): void;
    drawSphere(_id: string, _position: Point3, _radius?: number, _color?: number): void;
    drawPoints(_id: string, _points: Point3[], _color?: number, _size?: number): void;
    drawText(_id: string, _position: Point3, _text: string, _color?: string): void;
    erase(_id: string): void;
    clear(): void;
}
export {};
//# sourceMappingURL=ClientVisualizer.d.ts.map