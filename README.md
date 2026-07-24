# @yauseyea/node-observability

Shared OpenTelemetry tracing, Pyroscope continuous profiling, and a
trace-aware Pino logger, packaged for reuse across Node.js/TypeScript services.

## Install

\`\`\`bash
npm install @yauseyea/node-observability
\`\`\`

`@opentelemetry/api` and `pino` are peer dependencies — install them
alongside if you don't already have them:

\`\`\`bash
npm install @opentelemetry/api pino
\`\`\`

## ⚠️ Import order matters for tracing

OpenTelemetry's auto-instrumentation patches modules (http, express, pg, ...)
when they're first required. `initTracing()` must run **before** any of those
modules are imported anywhere in your app. There are two ways to guarantee this:

### Option A — Node `--import` preload (recommended)

Create an `instrumentation.js` in your app:

\`\`\`javascript
import { initTracing } from '@yauseyea/node-observability/tracing';

initTracing({
  serviceName: 'my-service',
  serviceVersion: process.env.npm_package_version,
  environment: process.env.NODE_ENV ?? 'local',
  exporterUrl: 'http://tempo:4318/v1/traces',
});
\`\`\`

Run your app with:

\`\`\`bash
node --import ./instrumentation.js dist/index.js
\`\`\`

This is Node/OTel's officially recommended pattern and removes any ordering risk.

### Option B — First imports in your entrypoint

If you can't change your start command, keep tracing/profiling as the
very first static imports in your entry file, before anything else:

\`\`\`typescript
// index.ts — must stay at the very top of the file
import { initProfiling } from '@yauseyea/node-observability/profiling';
import { initTracing } from '@yauseyea/node-observability/tracing';

initProfiling({
  serverAddress: 'http://pyroscope:4040',
  appName: 'my-service',
  environment: process.env.NODE_ENV ?? 'local',
});

initTracing({
  serviceName: 'my-service',
  environment: process.env.NODE_ENV ?? 'local',
  exporterUrl: 'http://tempo:4318/v1/traces',
});

import express from 'express'; // safe: imported after init above
import { Logger } from '@yauseyea/node-observability/logger';

const log = Logger.fromConfig({
  name: 'my-service',
  environment: 'local',
  streams: {
    console: { level: 'info', prettyPrint: true },
    loki: { level: 'info', url: 'http://loki:3100' },
  },
});
\`\`\`

## API

### `initTracing(config: TracingConfig): NodeSDK`

| field                | type                     | required | notes                                    |
|-----------------------|--------------------------|----------|-------------------------------------------|
| `serviceName`         | `string`                 | yes      |                                            |
| `serviceVersion`      | `string`                 | no       | omit to skip the attribute entirely       |
| `environment`         | `string`                 | yes      |                                            |
| `exporterUrl`         | `string`                 | yes      | OTLP HTTP traces endpoint                 |
| `resourceAttributes`  | `Record<string,string>`  | no       | merged into the OTel Resource             |

`readCallerPackageVersion()` is exported as a convenience if you want to
auto-fill `serviceVersion` from your app's own `package.json`:

\`\`\`typescript
import { initTracing, readCallerPackageVersion } from '@yauseyea/node-observability/tracing';

initTracing({
  serviceName: 'my-service',
  serviceVersion: readCallerPackageVersion(),
  environment: 'local',
  exporterUrl: 'http://tempo:4318/v1/traces',
});
\`\`\`

### `initProfiling(config: ProfilingConfig): void`

| field            | type                    | required | default |
|------------------|-------------------------|----------|---------|
| `serverAddress`  | `string`                | yes      |         |
| `appName`        | `string`                | yes      |         |
| `environment`    | `string`                | yes      |         |
| `tags`           | `Record<string,string>` | no       | `{}`    |
| `collectCpuTime` | `boolean`               | no       | `true`  |

### `Logger.fromConfig(config: LoggerConfig): Logger`

Console output and Loki shipping are each independently toggleable via
`enabled` (defaults: console on, loki on if a `url` is supplied). Every
log call automatically attaches the active OpenTelemetry `traceId`/`spanId`
when a sampled span is active, so logs and traces correlate in Grafana out
of the box.

\`\`\`typescript
const log = Logger.fromConfig({
  name: 'my-service',
  environment: 'prod',
  streams: {
    console: { level: 'info', prettyPrint: false },
    loki: { level: 'info', url: 'http://loki:3100' },
  },
});

log.info('server started', { port: 3000 });
const requestLog = log.child({ requestId: 'abc-123' });
\`\`\`

## Development

\`\`\`bash
npm install
npm run build
\`\`\`

## License

MIT (see [LICENSE](./LICENSE))