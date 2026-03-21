import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { catalogResponseSchema } from '@/http/schemas';
import { catalogToDTO } from '@/mappers/sales/catalog/catalog-to-dto';
import { makeGetCatalogByIdUseCase } from '@/use-cases/sales/catalogs/factories/make-get-catalog-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getCatalogByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/catalogs/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CATALOGS.ACCESS,
        resource: 'catalogs',
      }),
    ],
    schema: {
      tags: ['Sales - Catalogs'],
      summary: 'Get catalog by ID',
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ catalog: catalogResponseSchema }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      const useCase = makeGetCatalogByIdUseCase();
      const { catalog } = await useCase.execute({
        catalogId: id,
        tenantId,
      });

      return reply.status(200).send({ catalog: catalogToDTO(catalog) });
    },
  });
}
