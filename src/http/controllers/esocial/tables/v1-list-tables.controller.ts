import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { esocialTableSummarySchema } from '@/http/schemas/esocial';
import { makeListTablesUseCase } from '@/use-cases/esocial/tables/factories/make-list-tables';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListTablesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/esocial/tables',
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
      summary: 'List reference tables',
      description:
        'List all available eSocial government reference tables with item counts.',
      response: {
        200: z.object({
          tables: z.array(esocialTableSummarySchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (_request, reply) => {
      const useCase = makeListTablesUseCase();
      const { tables } = await useCase.execute();

      return reply.status(200).send({ tables });
    },
  });
}
