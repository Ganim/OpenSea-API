import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  blueprintResponseSchema,
  listBlueprintsQuerySchema,
} from '@/http/schemas/sales/blueprints';
import { processBlueprintToDTO } from '@/mappers/sales/process-blueprint/process-blueprint-to-dto';
import { makeListBlueprintsUseCase } from '@/use-cases/sales/blueprints/factories/make-list-blueprints-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listBlueprintsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/sales/blueprints',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.BLUEPRINTS.ACCESS,
        resource: 'blueprints',
      }),
    ],
    schema: {
      tags: ['Sales - Blueprints'],
      summary: 'List process blueprints',
      querystring: listBlueprintsQuerySchema,
      response: {
        200: z.object({
          blueprints: z.array(blueprintResponseSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { page, limit, pipelineId, search } = request.query;

      const useCase = makeListBlueprintsUseCase();
      const { blueprints, total, totalPages } = await useCase.execute({
        tenantId,
        page,
        limit,
        pipelineId,
        search,
      });

      return reply.status(200).send({
        blueprints: blueprints.map(processBlueprintToDTO),
        meta: {
          total,
          page,
          limit,
          pages: totalPages,
        },
      });
    },
  });
}
