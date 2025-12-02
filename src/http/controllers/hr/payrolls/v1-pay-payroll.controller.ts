import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import { idSchema, payrollResponseSchema } from '@/http/schemas';
import { payrollToDTO } from '@/mappers/hr/payroll';
import { makeProcessPayrollPaymentUseCase } from '@/use-cases/hr/payrolls/factories/make-process-payroll-payment-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function payPayrollController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/payrolls/:payrollId/pay',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['HR - Payroll'],
      summary: 'Process payroll payment',
      description: 'Marks a payroll as paid',
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
      const userId = request.user.sub;

      try {
        const processPayrollPaymentUseCase = makeProcessPayrollPaymentUseCase();
        const { payroll } = await processPayrollPaymentUseCase.execute({
          payrollId,
          paidBy: userId,
        });

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
