import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import { idSchema, payrollResponseSchema } from '@/http/schemas';
import { payrollToDTO } from '@/mappers/hr/payroll';
import { makeCancelPayrollUseCase } from '@/use-cases/hr/payrolls/factories/make-cancel-payroll-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function cancelPayrollController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/payrolls/:payrollId/cancel',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['HR - Payroll'],
      summary: 'Cancel payroll',
      description: 'Cancels a payroll (cannot cancel paid payrolls)',
      params: z.object({
        payrollId: idSchema,
      }),
      response: {
        200: z.object({
          payroll: payrollResponseSchema,
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
      const { payrollId } = request.params;

      try {
        const cancelPayrollUseCase = makeCancelPayrollUseCase();
        const { payroll } = await cancelPayrollUseCase.execute({ payrollId });

        return reply.status(200).send({ payroll: payrollToDTO(payroll) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (
          error instanceof Error &&
          error.message.toLowerCase().includes('não encontrad')
        ) {
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
