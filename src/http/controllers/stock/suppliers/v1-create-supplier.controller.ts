import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
    createSupplierSchema,
    supplierResponseSchema,
} from '@/http/schemas/stock/suppliers';
import { makeCreateSupplierUseCase } from '@/use-cases/stock/suppliers/factories/make-create-supplier-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createSupplierController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/suppliers',
    onRequest: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.SUPPLIERS.CREATE,
        resource: 'suppliers',
      }),
    ],
    schema: {
      tags: ['Stock - Suppliers'],
      summary: 'Create a new supplier',
      security: [{ bearerAuth: [] }],
      body: createSupplierSchema,
      response: {
        201: z.object({
          supplier: supplierResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      try {
        const useCase = makeCreateSupplierUseCase();
        const result = await useCase.execute(request.body);
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
