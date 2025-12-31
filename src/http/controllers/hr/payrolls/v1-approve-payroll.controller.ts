import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { idSchema, payrollResponseSchema } from '@/http/schemas';
import { payrollToDTO } from '@/mappers/hr/payroll';
import { makeApprovePayrollUseCase } from '@/use-cases/hr/payrolls/factories/make-approve-payroll-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function approvePayrollController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/payrolls/:payrollId/approve',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.PAYROLLS.MANAGE,
        resource: 'payrolls',
      }),
    ],
    schema: {
      tags: ['HR - Payroll'],
      summary: 'Approve payroll',
      description: 'Approves a calculated payroll',
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
        const approvePayrollUseCase = makeApprovePayrollUseCase();
        const { payroll } = await approvePayrollUseCase.execute({
          payrollId,
          approvedBy: userId,
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
