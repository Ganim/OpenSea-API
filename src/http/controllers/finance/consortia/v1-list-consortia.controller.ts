import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  consortiumResponseSchema,
  listConsortiaQuerySchema,
} from '@/http/schemas/finance';
import { makeListConsortiaUseCase } from '@/use-cases/finance/consortia/factories/make-list-consortia-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listConsortiaController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/consortia',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.CONSORTIA.LIST,
        resource: 'consortia',
      }),
    ],
    schema: {
      tags: ['Finance - Consortia'],
      summary: 'List consortia',
      security: [{ bearerAuth: [] }],
      querystring: listConsortiaQuerySchema,
      response: {
        200: z.object({
          consortia: z.array(consortiumResponseSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeListConsortiaUseCase();
      const result = await useCase.execute({ tenantId, ...request.query });

      return reply.status(200).send(result);
    },
  });
}
