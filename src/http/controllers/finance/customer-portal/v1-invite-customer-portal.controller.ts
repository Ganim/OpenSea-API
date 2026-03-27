import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeInviteCustomerPortalUseCase } from '@/use-cases/finance/customer-portal/factories/make-invite-customer-portal-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function inviteCustomerPortalController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/customer-portal/invite',
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
      summary: 'Invite a customer to the self-service portal',
      security: [{ bearerAuth: [] }],
      body: z.object({
        customerId: z.string().min(1),
        customerName: z.string().min(1).max(255),
        expiresInDays: z.number().int().positive().optional().default(30),
      }),
      response: {
        201: z.object({
          access: z.object({
            id: z.string(),
            customerId: z.string(),
            customerName: z.string().nullable(),
            accessToken: z.string(),
            isActive: z.boolean(),
            expiresAt: z.string().nullable(),
            createdAt: z.string(),
          }),
          portalUrl: z.string(),
        }),
        409: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { customerId, customerName, expiresInDays } = request.body;

      try {
        const useCase = makeInviteCustomerPortalUseCase();
        const { access, portalUrl } = await useCase.execute({
          tenantId,
          customerId,
          customerName,
          expiresInDays,
        });

        return reply.status(201).send({
          access: {
            id: access.id,
            customerId: access.customerId,
            customerName: access.customerName,
            accessToken: access.accessToken,
            isActive: access.isActive,
            expiresAt: access.expiresAt?.toISOString() ?? null,
            createdAt: access.createdAt.toISOString(),
          },
          portalUrl,
        });
      } catch (error) {
        if (error instanceof ConflictError) {
          return reply.status(409).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
