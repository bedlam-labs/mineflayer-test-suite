import type { Bot } from 'mineflayer';
import { Vec3 } from 'vec3';
import type { PathNode, PathVisualizer } from '../types';
type ViewerBot = Bot & {
    viewer?: {
        drawLine(id: string, points: Vec3[], color?: number): void;
        erase(id: string): void;
    };
};
export declare class PrismarinePathVisualizer implements PathVisualizer {
    private readonly bot;
    constructor(bot: ViewerBot);
    renderPath(nodes: PathNode[]): void;
    clear(): void;
}
export {};
//# sourceMappingURL=PrismarinePathVisualizer.d.ts.map