import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { careOptionsByCategorySchema } from '@/http/schemas/stock.schema';
import { makeListCareOptionsUseCase } from '@/use-cases/stock/care/factories/make-list-care-options-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listCareOptionsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/care/options',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.CARE.READ,
        resource: 'care',
      }),
    ],
    schema: {
      tags: ['Stock - Care'],
      summary: 'List all care instruction options grouped by category',
      description:
        'Returns the catalog of care instruction options (ISO 3758) grouped by category. Used to display available care labels for product configuration.',
      response: {
        200: z.object({
          options: careOptionsByCategorySchema,
        }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (_request, reply) => {
      const listCareOptions = makeListCareOptionsUseCase();
      const { options } = await listCareOptions.execute();

      return reply.status(200).send({ options });
    },
  });
}
