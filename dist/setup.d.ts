import type { SetupOptions, TestEnv } from './types';
export declare function setup(options: SetupOptions): Promise<TestEnv>;
export declare function waitForCondition(condition: () => boolean, intervalMs?: number, timeoutMs?: number): Promise<void>;
//# sourceMappingURL=setup.d.ts.map