import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  customerResponseSchema,
  updateCustomerSchema,
} from '@/http/schemas/sales.schema';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeGetCustomerByIdUseCase } from '@/use-cases/sales/customers/factories/make-get-customer-by-id-use-case';
import { makeUpdateCustomerUseCase } from '@/use-cases/sales/customers/factories/make-update-customer-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function updateCustomerController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/customers/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CUSTOMERS.UPDATE,
        resource: 'customers',
      }),
    ],
    schema: {
      tags: ['Sales - Customers'],
      summary: 'Update a customer',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: updateCustomerSchema.extend({
        type: z.enum(['INDIVIDUAL', 'BUSINESS']).optional(),
        isActive: z.boolean().optional(),
      }),
      response: {
        200: z.object({
          customer: customerResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body;
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const getCustomerByIdUseCase = makeGetCustomerByIdUseCase();

        const [{ user }, { customer: oldCustomer }] = await Promise.all([
          getUserByIdUseCase.execute({ userId }),
          getCustomerByIdUseCase.execute({ tenantId, id }),
        ]);
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeUpdateCustomerUseCase();
        const { customer } = await useCase.execute({ tenantId, id, ...body });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.CUSTOMER_UPDATE,
          entityId: id,
          placeholders: { userName, customerName: customer.name },
          oldData: { name: oldCustomer.name, email: oldCustomer.email },
          newData: body,
        });

        return reply.status(200).send({ customer });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
