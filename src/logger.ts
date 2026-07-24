import type { LoggerConfig, LogLevel } from './types.js';

import { trace } from '@opentelemetry/api';
import pino, {
  type Logger as PinoLogger,
  type LoggerOptions,
  type TransportTargetOptions,
} from 'pino';

export class Logger {
  private logger: PinoLogger;

  constructor(loggerConf: LoggerConfig) {
    const consoleConf = loggerConf.streams.console;
    const targets: TransportTargetOptions[] = [];

    if (consoleConf.enabled !== false) {
      targets.push(
        consoleConf.prettyPrint
          ? {
              target: 'pino-pretty',
              level: consoleConf.level,
              options: {
                colorize: true,
                translateTime: 'yyyy-mm-dd HH:MM:ss',
                ignore: 'pid,hostname',
              },
            }
          : {
              target: 'pino/file',
              level: consoleConf.level,
              options: { destination: 1 }, // stdout
            }
      );
    }

    const lokiConf = loggerConf.streams.loki;
    if (lokiConf?.url && lokiConf.enabled !== false) {
      targets.push({
        target: 'pino-loki',
        level: lokiConf.level,
        options: {
          host: lokiConf.url,
          labels: {
            app: loggerConf.name,
            env: loggerConf.environment,
          },
          replaceTimestamp: true,
          silenceErrors: false,
        },
      });
    }

    const pinoOptions: LoggerOptions = {
      name: loggerConf.name,
      level: consoleConf.level,
      transport: targets.length > 0 ? { targets } : undefined,
    };

    this.logger = pino(pinoOptions);
  }

  static fromConfig(config: LoggerConfig): Logger {
    return new Logger(config);
  }

  child(bindings: Record<string, unknown>): Logger {
    const child = Object.create(this) as Logger;
    child.logger = this.logger.child(bindings);
    return child;
  }

  private getTraceContext(): Record<string, string> {
    const span = trace.getActiveSpan();
    if (!span) return {};

    const { traceId, spanId, traceFlags } = span.spanContext();
    if (traceFlags !== 1) return {}; // not sampled

    return { traceId, spanId };
  }

  trace(msg: string, context?: Record<string, unknown>): void {
    this.logger.trace({ context, ...this.getTraceContext() }, msg);
  }
  debug(msg: string, context?: Record<string, unknown>): void {
    this.logger.debug({ context, ...this.getTraceContext() }, msg);
  }
  info(msg: string, context?: Record<string, unknown>): void {
    this.logger.info({ context, ...this.getTraceContext() }, msg);
  }
  warn(msg: string, context?: Record<string, unknown>): void {
    this.logger.warn({ context, ...this.getTraceContext() }, msg);
  }
  error(msg: string, context?: Record<string, unknown>): void {
    this.logger.error({ context, ...this.getTraceContext() }, msg);
  }
  fatal(msg: string, context?: Record<string, unknown>): void {
    this.logger.fatal({ context, ...this.getTraceContext() }, msg);
  }

  setLevel(level: LogLevel): void {
    this.logger.level = level;
  }

  getLevel(): LogLevel {
    return this.logger.level as LogLevel;
  }

  getPinoLogger(): PinoLogger {
    return this.logger;
  }
}
