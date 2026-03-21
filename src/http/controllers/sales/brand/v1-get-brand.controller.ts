import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { brandResponseSchema } from '@/http/schemas';
import { tenantBrandToDTO } from '@/mappers/sales/tenant-brand/tenant-brand-to-dto';
import { makeGetTenantBrandUseCase } from '@/use-cases/sales/tenant-brands/factories/make-get-tenant-brand-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getBrandController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/brand',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.BRAND.ACCESS,
        resource: 'brand',
      }),
    ],
    schema: {
      tags: ['Sales - Brand'],
      summary: 'Get tenant brand identity',
      response: {
        200: z.object({ brand: brandResponseSchema }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeGetTenantBrandUseCase();
      const { brand } = await useCase.execute({ tenantId });

      return reply.status(200).send({ brand: tenantBrandToDTO(brand) });
    },
  });
}
