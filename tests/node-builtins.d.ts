// tests/node-builtins.d.ts
/**
 * Declaraciones de tipos estrictas para módulos nativos de Node.js 22 utilizados
 * exclusivamente por la suite de pruebas (`tests/`) y el servidor de staging (`server/`).
 */

declare module 'node:test' {
  export function describe(name: string, fn: () => void | Promise<void>): void;
  export function it(name: string, fn: () => void | Promise<void>): void;
  export function beforeEach(fn: () => void | Promise<void>): void;
  export function afterEach(fn: () => void | Promise<void>): void;
  export function before(fn: () => void | Promise<void>): void;
  export function after(fn: () => void | Promise<void>): void;
}

declare module 'node:assert/strict' {
  interface StrictAssert {
    ok(value: unknown, message?: string | Error): asserts value;
    equal<T>(actual: unknown, expected: T, message?: string | Error): asserts actual is T;
    notEqual(actual: unknown, expected: unknown, message?: string | Error): void;
    deepEqual<T>(actual: unknown, expected: T, message?: string | Error): asserts actual is T;
    match(value: string, regExp: RegExp, message?: string | Error): void;
    doesNotMatch(value: string, regExp: RegExp, message?: string | Error): void;
    rejects(
      block: (() => Promise<unknown>) | Promise<unknown>,
      error?: RegExp | ((err: unknown) => boolean),
      message?: string
    ): Promise<void>;
  }
  const assert: StrictAssert;
  export default assert;
}

declare module 'node:fs' {
  export function existsSync(path: string): boolean;
  export function readFileSync(path: string, encoding: 'utf8'): string;
  export function readFileSync(path: string): Uint8Array;
  export function rmSync(path: string, options?: { force?: boolean; recursive?: boolean }): void;
  export function mkdtempSync(prefix: string): string;
}

declare module 'node:path' {
  export function join(...paths: string[]): string;
  export function resolve(...paths: string[]): string;
}

declare module 'node:os' {
  export function tmpdir(): string;
}

declare module 'node:http' {
  export interface AddressInfo {
    port: number;
    family: string;
    address: string;
  }
  export interface Server {
    listen(port?: number, host?: string, callback?: () => void): this;
    close(callback?: (err?: Error) => void): this;
    address(): string | AddressInfo | null;
  }
}

declare module '../server/stagingServer.mjs' {
  import type { Server } from 'node:http';
  export interface StagingServerOptions {
    env?: Record<string, string | undefined>;
    distDir?: string;
    logFile?: string;
    silentStdout?: boolean;
  }
  export interface StagingServerHandle {
    server: Server;
    getLogs: () => Record<string, unknown>[];
    getMetrics: () => {
      requestsTotal: number;
      errorsTotal: number;
      p95LatencyMs: number;
    };
  }
  export function createStagingServer(options?: StagingServerOptions): StagingServerHandle;
}
