import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import {
    idSchema,
    payrollItemResponseSchema,
    payrollResponseSchema,
} from '@/http/schemas';
import { payrollToDTO } from '@/mappers/hr/payroll';
import { payrollItemToDTO } from '@/mappers/hr/payroll-item';
import { makeCalculatePayrollUseCase } from '@/use-cases/hr/payrolls/factories/make-calculate-payroll-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function calculatePayrollController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/payrolls/:payrollId/calculate',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['HR - Payroll'],
      summary: 'Calculate payroll',
      description: 'Calculates all payroll items for active employees',
      params: z.object({
        payrollId: idSchema,
      }),
      response: {
        200: z.object({
          payroll: payrollResponseSchema,
          items: z.array(payrollItemResponseSchema),
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
        const calculatePayrollUseCase = makeCalculatePayrollUseCase();
        const { payroll, items } = await calculatePayrollUseCase.execute({
          payrollId,
          processedBy: userId,
        });

        return reply.status(200).send({
          payroll: payrollToDTO(payroll),
          items: items.map(payrollItemToDTO),
        });
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
