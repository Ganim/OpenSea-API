import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeCreatePortalAccessUseCase } from '@/use-cases/sales/analytics/customer-portal/factories/make-create-portal-access-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createPortalAccessController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/sales/analytics/customer-portal',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CUSTOMER_PORTAL.REGISTER,
        resource: 'customer-portal',
      }),
    ],
    schema: {
      tags: ['Sales - Customer Portal'],
      summary: 'Create customer portal access',
      body: z.object({
        customerId: z.string().uuid(),
        contactId: z.string().uuid().optional(),
        permissions: z.record(z.string(), z.boolean()).optional(),
        expiresAt: z.string().optional(),
      }),
      response: {
        201: z.object({ access: z.any() }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const data = request.body;

      try {
        const useCase = makeCreatePortalAccessUseCase();
        const result = await useCase.execute({ tenantId, ...data });
        return reply.status(201).send(result);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
