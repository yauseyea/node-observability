import type { TracingConfig } from './types.js';

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

let sdk: NodeSDK | undefined;

/**
 * Reads the `version` field from the consuming app's package.json
 * (resolved relative to process.cwd()). Returns undefined if it can't be read.
 */
export function readCallerPackageVersion(): string | undefined {
  try {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8')) as {
      version?: string;
    };
    return pkg.version;
  } catch {
    return undefined;
  }
}

/**
 * Initializes the OpenTelemetry Node SDK. Must be called before any other
 * module you want auto-instrumented (http, express, pg, etc.) is imported —
 * see README for the two supported patterns.
 */
export function initTracing(options: TracingConfig): NodeSDK {
  if (sdk) return sdk;

  const {
    serviceName,
    serviceVersion,
    environment,
    exporterUrl,
    resourceAttributes = {},
  } = options;

  sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
      ...(serviceVersion ? { [ATTR_SERVICE_VERSION]: serviceVersion } : {}),
      environment,
      ...resourceAttributes,
    }),
    traceExporter: new OTLPTraceExporter({ url: exporterUrl }),
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();

  const shutdown = () => {
    sdk
      ?.shutdown()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  };

  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);

  return sdk;
}

export function getTracingSdk(): NodeSDK | undefined {
  return sdk;
}
