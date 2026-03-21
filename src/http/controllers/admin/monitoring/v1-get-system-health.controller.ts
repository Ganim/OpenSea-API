import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeGetSystemHealthUseCase } from '@/use-cases/admin/monitoring/factories/make-get-system-health-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GetSystemHealthController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/admin/monitoring/health',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Monitoring'],
      summary: 'Get system health status (super admin)',
      description:
        'Returns system health metrics including API uptime, database connection status, and service health. Requires super admin privileges.',
      response: {
        200: z.object({
          health: z.object({
            status: z.enum(['healthy', 'degraded', 'unhealthy']),
            uptime: z.number(),
            timestamp: z.coerce.date(),
            services: z.object({
              api: z.object({
                status: z.string(),
                uptime: z.number(),
              }),
              database: z.object({
                status: z.string(),
                latencyMs: z.number(),
              }),
              redis: z.object({
                status: z.string(),
                latencyMs: z.number(),
              }),
            }),
          }),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (_request, reply) => {
      const getSystemHealthUseCase = makeGetSystemHealthUseCase();
      const { health } = await getSystemHealthUseCase.execute();

      return reply.status(200).send({ health });
    },
  });
}
