import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeDeleteCatalogUseCase } from '@/use-cases/sales/catalogs/factories/make-delete-catalog-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deleteCatalogController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/catalogs/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CATALOGS.REMOVE,
        resource: 'catalogs',
      }),
    ],
    schema: {
      tags: ['Sales - Catalogs'],
      summary: 'Delete a catalog',
      params: z.object({ id: z.string().uuid() }),
      response: {
        204: z.null(),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { id } = request.params;

      const useCase = makeDeleteCatalogUseCase();
      await useCase.execute({ catalogId: id, tenantId });

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.CATALOG_DELETE,
        entityId: id,
        placeholders: { userName: userId, catalogName: id },
      });

      return reply.status(204).send();
    },
  });
}
