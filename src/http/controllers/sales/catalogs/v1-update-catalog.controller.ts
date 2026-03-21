import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { updateCatalogSchema, catalogResponseSchema } from '@/http/schemas';
import { catalogToDTO } from '@/mappers/sales/catalog/catalog-to-dto';
import { makeUpdateCatalogUseCase } from '@/use-cases/sales/catalogs/factories/make-update-catalog-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateCatalogController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/catalogs/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CATALOGS.MODIFY,
        resource: 'catalogs',
      }),
    ],
    schema: {
      tags: ['Sales - Catalogs'],
      summary: 'Update a catalog',
      params: z.object({ id: z.string().uuid() }),
      body: updateCatalogSchema,
      response: {
        200: z.object({ catalog: catalogResponseSchema }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { id } = request.params;
      const body = request.body;

      const useCase = makeUpdateCatalogUseCase();
      // Convert null values from Zod nullable() to undefined for the use case
      const sanitized = Object.fromEntries(
        Object.entries(body).map(([k, v]) => [k, v === null ? undefined : v]),
      );
      const { catalog } = await useCase.execute({
        catalogId: id,
        tenantId,
        ...sanitized,
      } as Parameters<typeof useCase.execute>[0]);

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.CATALOG_UPDATE,
        entityId: catalog.id.toString(),
        placeholders: { userName: userId, catalogName: catalog.name },
        newData: body,
      });

      return reply.status(200).send({ catalog: catalogToDTO(catalog) });
    },
  });
}
