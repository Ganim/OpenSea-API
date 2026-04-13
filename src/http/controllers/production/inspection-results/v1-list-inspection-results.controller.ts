import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { inspectionResultResponseSchema } from '@/http/schemas/production';
import { inspectionResultToDTO } from '@/mappers/production/inspection-result-to-dto';
import { makeListInspectionResultsUseCase } from '@/use-cases/production/inspection-results/factories/make-list-inspection-results-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listInspectionResultsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/production/inspection-results',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.QUALITY.ACCESS,
        resource: 'inspection-results',
      }),
    ],
    schema: {
      tags: ['Production - Quality'],
      summary: 'List inspection results',
      querystring: z.object({
        productionOrderId: z.string(),
      }),
      response: {
        200: z.object({
          inspectionResults: z.array(inspectionResultResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { productionOrderId } = request.query;

      const listInspectionResultsUseCase = makeListInspectionResultsUseCase();
      const { inspectionResults } = await listInspectionResultsUseCase.execute({
        productionOrderId,
      });

      return reply.status(200).send({
        inspectionResults: inspectionResults.map(inspectionResultToDTO),
      });
    },
  });
}
