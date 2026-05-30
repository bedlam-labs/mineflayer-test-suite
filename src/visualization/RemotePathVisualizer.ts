import * as http from 'http';
import type { PathNode, PathVisualizer } from '../types';

export class RemotePathVisualizer implements PathVisualizer {
  constructor(private readonly adminPort: number) {}

  renderPath(nodes: PathNode[]): void {
    this.post({ nodes });
  }

  clear(): void {
    this.post({ clear: true });
  }

  private post(body: unknown): void {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: this.adminPort,
      path: '/visualize',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    });
    req.on('error', () => {});
    req.end(data);
  }
}
