import { env } from '@/@env';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import os from 'node:os';
import z from 'zod';

// Timestamp de quando o servidor iniciou
const startTime = Date.now();

export async function healthCheckController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/health',
    schema: {
      tags: ['Health'],
      summary: 'Detailed health check of the API',
      description:
        'Returns comprehensive health information including database, memory, uptime, and system details',
      response: {
        200: z.object({
          status: z.enum(['healthy', 'degraded']),
          timestamp: z.string(),
          uptime: z.number(),
          version: z.string(),
          environment: z.string(),
          checks: z.object({
            database: z.object({
              status: z.enum(['healthy', 'unhealthy']),
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
        }),
        503: z.object({
          status: z.literal('unhealthy'),
          timestamp: z.string(),
          error: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const timestamp = new Date().toISOString();
      const uptime = (Date.now() - startTime) / 1000; // em segundos

      try {
        // Check database
        const dbStart = Date.now();
        let databaseStatus: 'healthy' | 'unhealthy' = 'healthy';
        let dbResponseTime: number | undefined;
        let dbError: string | undefined;

        try {
          await prisma.$queryRaw`SELECT 1`;
          dbResponseTime = Date.now() - dbStart;
        } catch (error) {
          databaseStatus = 'unhealthy';
          dbError =
            error instanceof Error
              ? error.message
              : 'Database connection failed';
          logger.error({ error }, 'Database health check failed');
        }

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
          totalMemory: Math.round(totalMemory / 1024 / 1024), // MB
          freeMemory: Math.round(freeMemory / 1024 / 1024), // MB
        };

        // Determine overall status
        const overallStatus =
          databaseStatus === 'unhealthy' || memoryStatus === 'critical'
            ? 'degraded'
            : 'healthy';

        const statusCode = overallStatus === 'healthy' ? 200 : 503;

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
            memory: {
              status: memoryStatus,
              usage: {
                heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
                heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
                external: Math.round(memoryUsage.external / 1024 / 1024), // MB
                rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
              },
              percentage: parseFloat(memoryPercentage),
            },
            system: systemInfo,
          },
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
}
