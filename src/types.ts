export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'silent';

export interface LoggerConfig {
  name: string;
  environment: string;
  streams: {
    console: {
      enabled?: boolean; // default: true
      level: LogLevel;
      prettyPrint: boolean;
    };
    loki?: {
      enabled?: boolean; // default: true if url is set
      level: LogLevel;
      url: string;
    };
  };
}

export interface TracingConfig {
  serviceName: string;
  /** Falls back to undefined if you don't pass one; see readCallerPackageVersion(). */
  serviceVersion?: string;
  environment: string;
  /** OTLP HTTP trace exporter endpoint, e.g. http://tempo:4318/v1/traces */
  exporterUrl: string;
  /** Extra resource attributes merged into the OTel Resource. */
  resourceAttributes?: Record<string, string>;
}

export interface ProfilingConfig {
  serverAddress: string;
  appName: string;
  environment: string;
  tags?: Record<string, string>;
  /** Enables CPU profiling on top of wall time. Default: true. */
  collectCpuTime?: boolean;
}
