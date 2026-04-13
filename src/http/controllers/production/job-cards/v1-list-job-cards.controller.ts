import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { jobCardResponseSchema } from '@/http/schemas/production';
import { jobCardToDTO } from '@/mappers/production/job-card-to-dto';
import { makeListJobCardsUseCase } from '@/use-cases/production/job-cards/factories/make-list-job-cards-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listJobCardsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/production/job-cards',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.SHOPFLOOR.ACCESS,
        resource: 'job-cards',
      }),
    ],
    schema: {
      tags: ['Production - Shop Floor'],
      summary: 'List job cards',
      querystring: z.object({
        productionOrderId: z.string().optional(),
        workstationId: z.string().optional(),
      }),
      response: {
        200: z.object({
          jobCards: z.array(jobCardResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { productionOrderId, workstationId } = request.query;

      const listJobCardsUseCase = makeListJobCardsUseCase();
      const { jobCards } = await listJobCardsUseCase.execute({
        tenantId,
        productionOrderId,
        workstationId,
      });

      return reply.status(200).send({
        jobCards: jobCards.map(jobCardToDTO),
      });
    },
  });
}
