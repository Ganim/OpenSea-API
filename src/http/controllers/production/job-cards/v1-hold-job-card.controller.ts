import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { jobCardResponseSchema } from '@/http/schemas/production';
import { jobCardToDTO } from '@/mappers/production/job-card-to-dto';
import { makeHoldJobCardUseCase } from '@/use-cases/production/job-cards/factories/make-hold-job-card-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function holdJobCardController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/production/job-cards/:id/hold',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.SHOPFLOOR.MODIFY,
        resource: 'job-cards',
      }),
    ],
    schema: {
      tags: ['Production - Shop Floor'],
      summary: 'Put a job card on hold',
      params: z.object({
        id: z.string(),
      }),
      response: {
        200: z.object({
          jobCard: jobCardResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      const holdJobCardUseCase = makeHoldJobCardUseCase();
      const { jobCard } = await holdJobCardUseCase.execute({
        id,
        tenantId,
      });

      return reply.status(200).send({ jobCard: jobCardToDTO(jobCard) });
    },
  });
}
