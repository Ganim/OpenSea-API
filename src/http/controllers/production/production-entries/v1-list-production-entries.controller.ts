import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { productionEntryResponseSchema } from '@/http/schemas/production';
import { productionEntryToDTO } from '@/mappers/production/production-entry-to-dto';
import { makeListProductionEntriesUseCase } from '@/use-cases/production/production-entries/factories/make-list-production-entries-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listProductionEntriesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/production/production-entries',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.SHOPFLOOR.ACCESS,
        resource: 'production-entries',
      }),
    ],
    schema: {
      tags: ['Production - Shop Floor'],
      summary: 'List production entries by job card',
      querystring: z.object({
        jobCardId: z.string().min(1),
      }),
      response: {
        200: z.object({
          productionEntries: z.array(productionEntryResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { jobCardId } = request.query;

      const listProductionEntriesUseCase = makeListProductionEntriesUseCase();
      const { productionEntries } = await listProductionEntriesUseCase.execute({
        jobCardId,
      });

      return reply.status(200).send({
        productionEntries: productionEntries.map(productionEntryToDTO),
      });
    },
  });
}
