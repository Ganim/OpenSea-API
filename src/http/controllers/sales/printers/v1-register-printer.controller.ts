import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  registerPrinterBodySchema,
  registerPrinterResponseSchema,
} from '@/http/schemas/sales/printing/printer.schema';
import { makeRegisterPrinterUseCase } from '@/use-cases/sales/printing/factories/make-register-printer-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1RegisterPrinterController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/sales/printers',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.PRINTING.ADMIN,
        resource: 'sales-printers',
      }),
    ],
    schema: {
      tags: ['Sales - Printing'],
      summary: 'Register thermal printer',
      body: registerPrinterBodySchema,
      response: {
        201: registerPrinterResponseSchema,
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      try {
        const useCase = makeRegisterPrinterUseCase();
        const result = await useCase.execute({
          tenantId: request.user.tenantId!,
          ...request.body,
        });

        return reply.status(201).send({
          id: result.printerId,
          name: request.body.name,
          status: 'active',
        });
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
