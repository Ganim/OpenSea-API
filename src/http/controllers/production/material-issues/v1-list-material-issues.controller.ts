import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { materialIssueResponseSchema } from '@/http/schemas/production';
import { materialIssueToDTO } from '@/mappers/production/material-issue-to-dto';
import { makeListMaterialIssuesUseCase } from '@/use-cases/production/material-issues/factories/make-list-material-issues-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listMaterialIssuesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/production/material-issues',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.ORDERS.ACCESS,
        resource: 'material-issues',
      }),
    ],
    schema: {
      tags: ['Production - Materials'],
      summary: 'List material issues by production order',
      querystring: z.object({
        productionOrderId: z.string().min(1),
      }),
      response: {
        200: z.object({
          materialIssues: z.array(materialIssueResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { productionOrderId } = request.query;

      const listMaterialIssuesUseCase = makeListMaterialIssuesUseCase();
      const { materialIssues } = await listMaterialIssuesUseCase.execute({
        productionOrderId,
      });

      return reply.status(200).send({
        materialIssues: materialIssues.map(materialIssueToDTO),
      });
    },
  });
}
