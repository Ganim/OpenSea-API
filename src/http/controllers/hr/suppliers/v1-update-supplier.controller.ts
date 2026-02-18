import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  idSchema,
  supplierResponseSchema,
  updateSupplierSchema,
} from '@/http/schemas/hr.schema';
import { supplierToDTO } from '@/mappers/hr/organization/supplier-to-dto';
import { makeUpdateSupplierUseCase } from '@/use-cases/hr/suppliers/factories/make-suppliers';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1UpdateSupplierController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/hr/suppliers/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.SUPPLIERS.UPDATE,
        resource: 'suppliers',
      }),
    ],
    schema: {
      tags: ['HR - Suppliers'],
      summary: 'Update supplier',
      description: 'Updates a supplier by its ID',
      params: z.object({
        id: idSchema,
      }),
      body: updateSupplierSchema,
      response: {
        200: supplierResponseSchema,
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
      const { id } = request.params;
      const data = request.body;

      try {
        const updateSupplierUseCase = makeUpdateSupplierUseCase();
        const { supplier } = await updateSupplierUseCase.execute({
          id,
          ...data,
        });

        return reply.status(200).send(supplierToDTO(supplier));
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
