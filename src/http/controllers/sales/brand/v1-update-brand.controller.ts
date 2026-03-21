import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { updateBrandSchema, brandResponseSchema } from '@/http/schemas';
import { tenantBrandToDTO } from '@/mappers/sales/tenant-brand/tenant-brand-to-dto';
import { makeUpdateTenantBrandUseCase } from '@/use-cases/sales/tenant-brands/factories/make-update-tenant-brand-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateBrandController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/brand',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.BRAND.MODIFY,
        resource: 'brand',
      }),
    ],
    schema: {
      tags: ['Sales - Brand'],
      summary: 'Update tenant brand identity',
      body: updateBrandSchema,
      response: {
        200: z.object({ brand: brandResponseSchema }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const body = request.body;

      const useCase = makeUpdateTenantBrandUseCase();
      const { brand } = await useCase.execute({
        tenantId,
        ...body,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.BRAND_UPDATE,
        entityId: brand.id.toString(),
        placeholders: { userName: userId },
        newData: body,
      });

      return reply.status(200).send({ brand: tenantBrandToDTO(brand) });
    },
  });
}
