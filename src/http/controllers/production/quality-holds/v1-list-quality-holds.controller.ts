import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { qualityHoldResponseSchema } from '@/http/schemas/production';
import { qualityHoldToDTO } from '@/mappers/production/quality-hold-to-dto';
import { makeListQualityHoldsUseCase } from '@/use-cases/production/quality-holds/factories/make-list-quality-holds-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listQualityHoldsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/production/quality-holds',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.QUALITY.ACCESS,
        resource: 'quality-holds',
      }),
    ],
    schema: {
      tags: ['Production - Quality'],
      summary: 'List quality holds',
      querystring: z.object({
        productionOrderId: z.string().optional(),
        status: z.enum(['ACTIVE', 'RELEASED', 'SCRAPPED']).optional(),
      }),
      response: {
        200: z.object({
          qualityHolds: z.array(qualityHoldResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { productionOrderId, status } = request.query;

      const listQualityHoldsUseCase = makeListQualityHoldsUseCase();
      const { qualityHolds } = await listQualityHoldsUseCase.execute({
        productionOrderId,
        status,
      });

      return reply.status(200).send({
        qualityHolds: qualityHolds.map(qualityHoldToDTO),
      });
    },
  });
}
