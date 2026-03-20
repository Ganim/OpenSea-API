import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { idSchema, payrollResponseSchema } from '@/http/schemas';
import { payrollToDTO } from '@/mappers/hr/payroll';
import { makeCancelPayrollUseCase } from '@/use-cases/hr/payrolls/factories/make-cancel-payroll-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CancelPayrollController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/payrolls/:payrollId/cancel',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.PAYROLL.ADMIN,
        resource: 'payrolls',
      }),
    ],
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
      const tenantId = request.user.tenantId!;
      const { payrollId } = request.params;

      try {
        const cancelPayrollUseCase = makeCancelPayrollUseCase();
        const { payroll } = await cancelPayrollUseCase.execute({
          tenantId,
          payrollId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.PAYROLL_CANCEL,
          entityId: payrollId,
          placeholders: {
            userName: request.user.sub,
            month: String(payroll.referenceMonth),
            year: String(payroll.referenceYear),
          },
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
