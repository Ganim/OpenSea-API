import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { templateResponseSchema } from '@/http/schemas/stock.schema';
import { makeListTemplatesUseCase } from '@/use-cases/stock/templates/factories/make-list-templates-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listTemplatesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/templates',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.TEMPLATES.LIST,
        resource: 'templates',
      }),
    ],
    schema: {
      tags: ['Stock - Templates'],
      summary: 'List all templates',
      response: {
        200: z.object({
          templates: z.array(templateResponseSchema),
        }),
      },
    },
    handler: async (request, reply) => {
      const listTemplates = makeListTemplatesUseCase();

      const { templates } = await listTemplates.execute();

      return reply.status(200).send({ templates });
    },
  });
}
