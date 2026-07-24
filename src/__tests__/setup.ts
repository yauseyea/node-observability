import { vi } from 'vitest';

// Prevent pino-loki from trying to connect
vi.mock('pino-loki', () => ({
  default: () => ({ write: vi.fn() }),
}));

// Prevent Pyroscope from starting
vi.mock('@pyroscope/nodejs', () => ({
  default: { init: vi.fn(), start: vi.fn(), stop: vi.fn().mockResolvedValue(undefined) },
}));

// Prevent OTel SDK from starting
vi.mock('@opentelemetry/sdk-node', () => ({
  NodeSDK: vi.fn().mockImplementation(() => ({
    start: vi.fn(),
    shutdown: vi.fn().mockResolvedValue(undefined),
  })),
}));
