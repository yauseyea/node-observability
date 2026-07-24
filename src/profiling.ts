import type { ProfilingConfig } from './types.js';

import Pyroscope from '@pyroscope/nodejs';

let started = false;

/**
 * Initializes and starts Pyroscope continuous profiling.
 * Safe to call multiple times — only the first call takes effect.
 */
export function initProfiling(options: ProfilingConfig): void {
  if (started) return;
  started = true;

  const { serverAddress, appName, environment, tags = {}, collectCpuTime = true } = options;

  Pyroscope.init({
    serverAddress,
    appName,
    tags: { env: environment, ...tags },
    wall: { collectCpuTime },
  });

  Pyroscope.start();

  const shutdown = () => {
    Pyroscope.stop()
      .then(() => {})
      .catch(() => {});
  };

  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}
