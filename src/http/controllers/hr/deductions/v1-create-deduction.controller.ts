import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { createDeductionSchema, deductionResponseSchema } from '@/http/schemas';
import { deductionToDTO } from '@/mappers/hr/deduction';
import { makeCreateDeductionUseCase } from '@/use-cases/hr/deductions/factories/make-create-deduction-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createDeductionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/deductions',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.DEDUCTIONS.CREATE,
        resource: 'deductions',
      }),
    ],
    schema: {
      tags: ['HR - Deduction'],
      summary: 'Create deduction',
      description: 'Creates a new deduction for an employee',
      body: createDeductionSchema,
      response: {
        201: z.object({
          deduction: deductionResponseSchema,
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
      const data = request.body;

      try {
        const createDeductionUseCase = makeCreateDeductionUseCase();
        const { deduction } = await createDeductionUseCase.execute(data);

        return reply.status(201).send({ deduction: deductionToDTO(deduction) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
