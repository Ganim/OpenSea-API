import { env } from '@/@env';
import { getAllCircuitBreakerStats } from '@/lib/circuit-breaker';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { checkRedisHealth } from '@/lib/redis';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import os from 'node:os';
import z from 'zod';

// Timestamp de quando o servidor iniciou
const startTime = Date.now();

export async function healthCheckController(app: FastifyInstance) {
  // Health check completo
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/health',
    schema: {
      tags: ['Health'],
      summary: 'Detailed health check of the API',
      description:
        'Returns comprehensive health information including database, Redis, memory, uptime, and system details',
      response: {
        200: z.object({
          status: z.enum(['healthy', 'degraded', 'unhealthy']),
          timestamp: z.string(),
          uptime: z.number(),
          version: z.string(),
          environment: z.string(),
          checks: z.object({
            database: z.object({
              status: z.enum(['up', 'down']),
              responseTime: z.number().optional(),
              error: z.string().optional(),
            }),
            redis: z.object({
              status: z.enum(['up', 'down']),
              responseTime: z.number().optional(),
              error: z.string().optional(),
            }),
            memory: z.object({
              status: z.enum(['healthy', 'warning', 'critical']),
              usage: z.object({
                heapUsed: z.number(),
                heapTotal: z.number(),
                external: z.number(),
                rss: z.number(),
              }),
              percentage: z.number(),
            }),
            system: z.object({
              platform: z.string(),
              nodeVersion: z.string(),
              cpus: z.number(),
              totalMemory: z.number(),
              freeMemory: z.number(),
            }),
          }),
          circuitBreakers: z
            .record(
              z.string(),
              z.object({
                name: z.string(),
                state: z.enum(['CLOSED', 'OPEN', 'HALF_OPEN']),
                stats: z.object({
                  successes: z.number(),
                  failures: z.number(),
                  rejects: z.number(),
                  timeouts: z.number(),
                  fallbacks: z.number(),
                }),
              }),
            )
            .optional(),
        }),
        503: z.object({
          status: z.enum(['degraded', 'unhealthy']),
          timestamp: z.string(),
          error: z.string().optional(),
          checks: z.any().optional(),
        }),
      },
    },
    handler: async (request, reply) => {
      const timestamp = new Date().toISOString();
      const uptime = (Date.now() - startTime) / 1000;

      try {
        // Check database
        const dbStart = Date.now();
        let databaseStatus: 'up' | 'down' = 'up';
        let dbResponseTime: number | undefined;
        let dbError: string | undefined;

        try {
          await prisma.$queryRaw`SELECT 1`;
          dbResponseTime = Date.now() - dbStart;
        } catch (error) {
          databaseStatus = 'down';
          dbError =
            error instanceof Error
              ? error.message
              : 'Database connection failed';
          logger.error({ error }, 'Database health check failed');
        }

        // Check Redis
        const redisHealth = await checkRedisHealth();

        // Check memory
        const memoryUsage = process.memoryUsage();
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const memoryPercentage = (
          (memoryUsage.rss / totalMemory) *
          100
        ).toFixed(2);

        let memoryStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
        if (parseFloat(memoryPercentage) > 90) {
          memoryStatus = 'critical';
        } else if (parseFloat(memoryPercentage) > 75) {
          memoryStatus = 'warning';
        }

        // System information
        const systemInfo = {
          platform: process.platform,
          nodeVersion: process.version,
          cpus: os.cpus().length,
          totalMemory: Math.round(totalMemory / 1024 / 1024),
          freeMemory: Math.round(freeMemory / 1024 / 1024),
        };

        // Circuit breakers status
        const circuitBreakers = getAllCircuitBreakerStats();

        // Determine overall status
        let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

        if (databaseStatus === 'down') {
          overallStatus = 'unhealthy';
        } else if (
          redisHealth.status === 'down' ||
          memoryStatus === 'critical'
        ) {
          overallStatus = 'degraded';
        }

        // Check if any circuit breaker is open
        const hasOpenCircuit = Object.values(circuitBreakers).some(
          (cb) => cb.state === 'OPEN',
        );
        if (hasOpenCircuit && overallStatus === 'healthy') {
          overallStatus = 'degraded';
        }

        const statusCode = overallStatus === 'unhealthy' ? 503 : 200;

        return reply.status(statusCode).send({
          status: overallStatus,
          timestamp,
          uptime: Math.round(uptime),
          version: '3.5.0',
          environment: env.NODE_ENV,
          checks: {
            database: {
              status: databaseStatus,
              responseTime: dbResponseTime,
              error: dbError,
            },
            redis: {
              status: redisHealth.status,
              responseTime: redisHealth.latency,
              error: redisHealth.error,
            },
            memory: {
              status: memoryStatus,
              usage: {
                heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                external: Math.round(memoryUsage.external / 1024 / 1024),
                rss: Math.round(memoryUsage.rss / 1024 / 1024),
              },
              percentage: parseFloat(memoryPercentage),
            },
            system: systemInfo,
          },
          circuitBreakers:
            Object.keys(circuitBreakers).length > 0
              ? circuitBreakers
              : undefined,
        });
      } catch (error) {
        logger.error({ error }, 'Health check failed');
        return reply.status(503).send({
          status: 'unhealthy',
          timestamp,
          error:
            error instanceof Error
              ? error.message
              : 'Health check failed unexpectedly',
        });
      }
    },
  });

  // Readiness probe (para Kubernetes)
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/health/ready',
    schema: {
      tags: ['Health'],
      summary: 'Readiness probe for Kubernetes',
      description: 'Checks if the application is ready to receive traffic',
      response: {
        200: z.object({
          status: z.literal('ready'),
          timestamp: z.string(),
          checks: z.object({
            database: z.object({
              status: z.enum(['up', 'down']),
            }),
            redis: z.object({
              status: z.enum(['up', 'down']),
            }),
          }),
        }),
        503: z.object({
          status: z.literal('not_ready'),
          timestamp: z.string(),
          checks: z.object({
            database: z.object({
              status: z.enum(['up', 'down']),
            }),
            redis: z.object({
              status: z.enum(['up', 'down']),
            }),
          }),
        }),
      },
    },
    handler: async (request, reply) => {
      const timestamp = new Date().toISOString();

      // Check database
      let databaseStatus: 'up' | 'down' = 'up';
      try {
        await prisma.$queryRaw`SELECT 1`;
      } catch {
        databaseStatus = 'down';
      }

      // Check Redis
      const redisHealth = await checkRedisHealth();

      // Para estar ready, o banco precisa estar up
      // Redis pode estar down (degraded mode)
      const isReady = databaseStatus === 'up';

      const response = {
        status: isReady ? ('ready' as const) : ('not_ready' as const),
        timestamp,
        checks: {
          database: { status: databaseStatus },
          redis: { status: redisHealth.status },
        },
      };

      return reply.status(isReady ? 200 : 503).send(response);
    },
  });

  // Liveness probe (para Kubernetes)
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/health/live',
    schema: {
      tags: ['Health'],
      summary: 'Liveness probe for Kubernetes',
      description: 'Checks if the application process is alive',
      response: {
        200: z.object({
          status: z.literal('alive'),
          timestamp: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      // Liveness é simples - se responde, está vivo
      // Não verifica dependências para evitar restarts desnecessários
      return reply.status(200).send({
        status: 'alive',
        timestamp: new Date().toISOString(),
      });
    },
  });
}
