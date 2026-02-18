import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createSupplierSchema,
  supplierResponseSchema,
} from '@/http/schemas/hr.schema';
import { supplierToDTO } from '@/mappers/hr/organization/supplier-to-dto';
import { makeCreateSupplierUseCase } from '@/use-cases/hr/suppliers/factories/make-suppliers';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CreateSupplierController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/suppliers',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.SUPPLIERS.CREATE,
        resource: 'suppliers',
      }),
    ],
    schema: {
      tags: ['HR - Suppliers'],
      summary: 'Create a new supplier',
      description: 'Creates a new supplier in the system',
      body: createSupplierSchema,
      response: {
        201: supplierResponseSchema,
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const data = request.body;

      try {
        const createSupplierUseCase = makeCreateSupplierUseCase();
        const { supplier } = await createSupplierUseCase.execute({
          tenantId,
          ...data,
        });

        return reply.status(201).send(supplierToDTO(supplier));
      } catch (error) {
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
