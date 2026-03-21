import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { addCatalogItemSchema } from '@/http/schemas';
import { makeAddCatalogItemUseCase } from '@/use-cases/sales/catalogs/factories/make-add-catalog-item-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function addCatalogItemController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/catalogs/:id/items',
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
      summary: 'Add an item to a catalog',
      params: z.object({ id: z.string().uuid() }),
      body: addCatalogItemSchema,
      response: {
        201: z.object({ itemId: z.string().uuid() }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { id } = request.params;
      const body = request.body;

      const useCase = makeAddCatalogItemUseCase();
      const { itemId } = await useCase.execute({
        catalogId: id,
        tenantId,
        variantId: body.variantId,
        position: body.position,
        featured: body.featured,
        customNote: body.customNote,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.CATALOG_ITEM_ADD,
        entityId: id,
        placeholders: { userName: userId, catalogName: id },
        newData: { variantId: body.variantId },
      });

      return reply.status(201).send({ itemId });
    },
  });
}
