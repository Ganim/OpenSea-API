import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  esocialTableItemSchema,
  getTableItemsParamsSchema,
  getTableItemsQuerySchema,
} from '@/http/schemas/esocial';
import { makeGetTableItemsUseCase } from '@/use-cases/esocial/tables/factories/make-get-table-items';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GetTableItemsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/esocial/tables/:code',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.ESOCIAL.TABLES.ACCESS,
        resource: 'esocial-tables',
      }),
    ],
    schema: {
      tags: ['eSocial - Tables'],
      summary: 'Get table items',
      description:
        'Get all items from a specific eSocial reference table by code.',
      params: getTableItemsParamsSchema,
      querystring: getTableItemsQuerySchema,
      response: {
        200: z.object({
          items: z.array(esocialTableItemSchema),
          total: z.number(),
        }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const { code } = request.params;
      const { search } = request.query;

      try {
        const useCase = makeGetTableItemsUseCase();
        const { items, total } = await useCase.execute({
          tableCode: code,
          search,
        });

        return reply.status(200).send({ items, total });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
