import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
  Counter,
  Histogram,
  Registry,
  collectDefaultMetrics,
} from 'prom-client';

const register = new Registry();

// Collect Node.js default metrics (memory, CPU, event loop, GC)
collectDefaultMetrics({ register });

// HTTP request duration histogram
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

// HTTP request counter
const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'] as const,
  registers: [register],
});

// HTTP request size
const httpRequestSize = new Histogram({
  name: 'http_request_size_bytes',
  help: 'Size of HTTP request bodies in bytes',
  labelNames: ['method', 'route'] as const,
  buckets: [100, 1000, 10000, 100000, 1000000],
  registers: [register],
});

// Active connections gauge
const activeRequests = new Counter({
  name: 'http_active_requests_total',
  help: 'Total active HTTP requests (use rate to see concurrency)',
  labelNames: ['method'] as const,
  registers: [register],
});

/**
 * Normalizes a URL to a route pattern (e.g., /v1/products/abc-123 → /v1/products/:id).
 * Prevents high-cardinality labels in Prometheus.
 */
function normalizeRoute(url: string): string {
  return url
    .replace(
      /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      '/:id',
    )
    .replace(/\/\d+/g, '/:id')
    .split('?')[0];
}

export async function prometheusPlugin(app: FastifyInstance) {
  // Metrics endpoint
  app.get('/metrics', async (_request, reply) => {
    reply.header('Content-Type', register.contentType);
    return register.metrics();
  });

  // Track request timing
  app.addHook(
    'onRequest',
    async (request: FastifyRequest, _reply: FastifyReply) => {
      (request as unknown as Record<string, unknown>).__metricsStart =
        process.hrtime.bigint();
      activeRequests.inc({ method: request.method });
    },
  );

  app.addHook(
    'onResponse',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const start = (request as unknown as Record<string, unknown>)
        .__metricsStart as bigint | undefined;
      if (!start) return;

      const durationNs = Number(process.hrtime.bigint() - start);
      const durationSeconds = durationNs / 1e9;

      const route = normalizeRoute(request.url);
      const labels = {
        method: request.method,
        route,
        status_code: String(reply.statusCode),
      };

      httpRequestDuration.observe(labels, durationSeconds);
      httpRequestTotal.inc(labels);

      const contentLength = request.headers['content-length'];
      if (contentLength) {
        httpRequestSize.observe(
          { method: request.method, route },
          parseInt(contentLength, 10),
        );
      }
    },
  );
}

export { register };
