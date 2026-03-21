import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeUpdateSlaConfigUseCase } from '@/use-cases/admin/support/factories/make-update-sla-config-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateSlaConfigAdminController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/admin/support/sla/:priority',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Support'],
      summary: 'Update SLA configuration (super admin)',
      description:
        'Updates SLA configuration for a specific priority level. Requires super admin privileges.',
      params: z.object({
        priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
      }),
      body: z.object({
        firstResponseMinutes: z.number().int().positive(),
        resolutionMinutes: z.number().int().positive(),
      }),
      response: {
        200: z.object({
          slaConfig: z.object({
            id: z.string(),
            priority: z.string(),
            firstResponseMinutes: z.number(),
            resolutionMinutes: z.number(),
            createdAt: z.coerce.date(),
            updatedAt: z.coerce.date(),
          }),
        }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { priority } = request.params;
      const { firstResponseMinutes, resolutionMinutes } = request.body;

      try {
        const updateSlaConfigUseCase = makeUpdateSlaConfigUseCase();
        const { slaConfig } = await updateSlaConfigUseCase.execute({
          priority,
          firstResponseMinutes,
          resolutionMinutes,
        });

        return reply.status(200).send({ slaConfig });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
