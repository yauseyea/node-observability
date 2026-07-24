import { trace } from '@opentelemetry/api';
import { describe, it, expect, vi } from 'vitest';

import { Logger } from '../logger.js';
import type { LoggerConfig } from '../types.js';

vi.mock('@opentelemetry/api', () => ({
  trace: {
    getActiveSpan: vi.fn(),
  },
}));

const baseConfig: LoggerConfig = {
  name: 'test',
  environment: 'local',
  streams: {
    console: { level: 'info', prettyPrint: false },
    loki: { level: 'info', url: 'http://localhost:3100' },
  },
};

describe('Logger', () => {
  it('creates a logger via fromConfig', () => {
    const log = Logger.fromConfig(baseConfig);
    expect(log).toBeInstanceOf(Logger);
  });

  it('creates a child logger', () => {
    const log = Logger.fromConfig(baseConfig);
    const child = log.child({ requestId: '123' });
    expect(child).toBeInstanceOf(Logger);
  });

  it('get/setLevel round-trips', () => {
    const log = Logger.fromConfig(baseConfig);
    log.setLevel('debug');
    expect(log.getLevel()).toBe('debug');
  });

  it('getPinoLogger returns underlying pino instance', () => {
    const log = Logger.fromConfig(baseConfig);
    expect(log.getPinoLogger()).toBeDefined();
  });

  it('does not throw when logging at each level', () => {
    const log = Logger.fromConfig(baseConfig);
    expect(() => {
      log.trace('trace msg');
      log.debug('debug msg');
      log.info('info msg');
      log.warn('warn msg');
      log.error('error msg');
    }).not.toThrow();
  });

  it('uses pretty print when prettyPrint is true', () => {
    const prettyConfig: LoggerConfig = {
      ...baseConfig,
      streams: { ...baseConfig.streams, console: { level: 'info', prettyPrint: true } },
    };
    // pino-pretty is mocked in setup, so this just verifies construction doesn't throw
    expect(() => Logger.fromConfig(prettyConfig)).not.toThrow();
  });

  it('fatal does not throw', () => {
    const log = Logger.fromConfig(baseConfig);
    expect(() => log.fatal('fatal msg')).not.toThrow();
  });

  it('handles missing active span', () => {
    vi.mocked(trace.getActiveSpan).mockReturnValue(undefined);

    const log = Logger.fromConfig(baseConfig);

    expect(() => log.info('hello')).not.toThrow();
  });

  it('handles unsampled span', () => {
    vi.mocked(trace.getActiveSpan).mockReturnValue({
      spanContext: () => ({
        traceId: 'trace',
        spanId: 'span',
        traceFlags: 0,
      }),
    } as any);

    const log = Logger.fromConfig(baseConfig);

    expect(() => log.info('hello')).not.toThrow();
  });

  it('handles sampled span', () => {
    vi.mocked(trace.getActiveSpan).mockReturnValue({
      spanContext: () => ({
        traceId: 'trace',
        spanId: 'span',
        traceFlags: 1,
      }),
    } as any);

    const log = Logger.fromConfig(baseConfig);

    expect(() => log.info('hello')).not.toThrow();
  });

  it('disables console transport when console.enabled is false', () => {
    const noConsoleConfig: LoggerConfig = {
      ...baseConfig,
      streams: {
        ...baseConfig.streams,
        console: { ...baseConfig.streams.console, enabled: false },
      },
    };
    expect(() => Logger.fromConfig(noConsoleConfig)).not.toThrow();
  });

  it('omits loki transport when no loki config is provided', () => {
    const noLokiConfig: LoggerConfig = {
      name: 'test',
      environment: 'local',
      streams: {
        console: { level: 'info', prettyPrint: false },
      },
    };
    expect(() => Logger.fromConfig(noLokiConfig)).not.toThrow();
  });
});