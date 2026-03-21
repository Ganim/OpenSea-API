import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeGetSlaConfigUseCase } from '@/use-cases/admin/support/factories/make-get-sla-config-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getSlaConfigAdminController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/admin/support/sla',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Support'],
      summary: 'Get SLA configurations (super admin)',
      description:
        'Returns all SLA configurations for each priority level. Requires super admin privileges.',
      response: {
        200: z.object({
          slaConfigs: z.array(
            z.object({
              id: z.string(),
              priority: z.string(),
              firstResponseMinutes: z.number(),
              resolutionMinutes: z.number(),
              createdAt: z.coerce.date(),
              updatedAt: z.coerce.date(),
            }),
          ),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (_request, reply) => {
      const getSlaConfigUseCase = makeGetSlaConfigUseCase();
      const { slaConfigs } = await getSlaConfigUseCase.execute();

      return reply.status(200).send({ slaConfigs });
    },
  });
}
