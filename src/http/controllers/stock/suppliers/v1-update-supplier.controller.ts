import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  supplierResponseSchema,
  updateSupplierSchema,
} from '@/http/schemas/stock/suppliers';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeGetSupplierByIdUseCase } from '@/use-cases/stock/suppliers/factories/make-get-supplier-by-id-use-case';
import { makeUpdateSupplierUseCase } from '@/use-cases/stock/suppliers/factories/make-update-supplier-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function updateSupplierController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/suppliers/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.SUPPLIERS.UPDATE,
        resource: 'suppliers',
      }),
    ],
    schema: {
      tags: ['Stock - Suppliers'],
      summary: 'Update a supplier',
      security: [{ bearerAuth: [] }],
      params: z.object({
        id: z.uuid(),
      }),
      body: updateSupplierSchema,
      response: {
        200: z.object({
          supplier: supplierResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params;
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const getSupplierByIdUseCase = makeGetSupplierByIdUseCase();

        const [{ user }, { supplier: oldSupplier }] = await Promise.all([
          getUserByIdUseCase.execute({ userId }),
          getSupplierByIdUseCase.execute({ tenantId, id }),
        ]);
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeUpdateSupplierUseCase();
        const result = await useCase.execute({
          tenantId,
          id,
          ...request.body,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.STOCK.SUPPLIER_UPDATE,
          entityId: id,
          placeholders: { userName, supplierName: result.supplier.name },
          oldData: {
            name: oldSupplier.name,
            email: oldSupplier.email,
            phone: oldSupplier.phone,
          },
          newData: request.body,
        });

        return reply.status(200).send(result);
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
