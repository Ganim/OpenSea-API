import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeListCustomerPortalAccessesUseCase } from '@/use-cases/finance/customer-portal/factories/make-list-customer-portal-accesses-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listCustomerPortalAccessesController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/customer-portal/accesses',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.ADMIN,
        resource: 'entries',
      }),
    ],
    schema: {
      tags: ['Finance - Customer Portal'],
      summary: 'List all customer portal accesses for the tenant',
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({
          accesses: z.array(
            z.object({
              id: z.string(),
              customerId: z.string(),
              customerName: z.string().nullable(),
              isActive: z.boolean(),
              lastAccessAt: z.string().nullable(),
              expiresAt: z.string().nullable(),
              createdAt: z.string(),
            }),
          ),
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeListCustomerPortalAccessesUseCase();
      const { accesses } = await useCase.execute({ tenantId });

      return reply.status(200).send({
        accesses: accesses.map((access) => ({
          id: access.id,
          customerId: access.customerId,
          customerName: access.customerName,
          isActive: access.isActive,
          lastAccessAt: access.lastAccessAt?.toISOString() ?? null,
          expiresAt: access.expiresAt?.toISOString() ?? null,
          createdAt: access.createdAt.toISOString(),
        })),
      });
    },
  });
}
