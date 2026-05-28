import type { PathNode, PathVisualizer } from '../types';

export type { PathNode, PathVisualizer };

export class NullPathVisualizer implements PathVisualizer {
  renderPath(_nodes: PathNode[]): void {}
  clear(): void {}
}
