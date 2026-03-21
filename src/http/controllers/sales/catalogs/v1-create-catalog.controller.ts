import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { createCatalogSchema, catalogResponseSchema } from '@/http/schemas';
import { catalogToDTO } from '@/mappers/sales/catalog/catalog-to-dto';
import { makeCreateCatalogUseCase } from '@/use-cases/sales/catalogs/factories/make-create-catalog-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createCatalogController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/catalogs',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CATALOGS.REGISTER,
        resource: 'catalogs',
      }),
    ],
    schema: {
      tags: ['Sales - Catalogs'],
      summary: 'Create a new catalog',
      body: createCatalogSchema,
      response: {
        201: z.object({ catalog: catalogResponseSchema }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const body = request.body;

      const useCase = makeCreateCatalogUseCase();
      const { catalog } = await useCase.execute({
        tenantId,
        name: body.name,
        description: body.description,
        type: body.type,
        slug: body.slug,
        layout: body.layout,
        showPrices: body.showPrices,
        showStock: body.showStock,
        isPublic: body.isPublic,
        customerId: body.customerId,
        campaignId: body.campaignId,
        assignedToUserId: body.assignedToUserId,
        priceTableId: body.priceTableId,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.CATALOG_CREATE,
        entityId: catalog.id.toString(),
        placeholders: { userName: userId, catalogName: catalog.name },
        newData: { name: body.name, type: body.type },
      });

      return reply.status(201).send({ catalog: catalogToDTO(catalog) });
    },
  });
}
