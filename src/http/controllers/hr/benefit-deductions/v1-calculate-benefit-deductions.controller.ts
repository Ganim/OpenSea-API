import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  benefitDeductionsResponseSchema,
  calculateBenefitDeductionsSchema,
} from '@/http/schemas/hr/benefits';
import { makeCalculateBenefitDeductionsUseCase } from '@/use-cases/hr/benefit-deductions/factories/make-calculate-benefit-deductions-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CalculateBenefitDeductionsController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/benefit-deductions/calculate',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.PAYROLL.ACCESS,
        resource: 'benefit-deductions',
      }),
    ],
    schema: {
      tags: ['HR - Benefits'],
      summary: 'Calculate benefit deductions',
      description:
        'Calculates all benefit deductions for an employee (VT 6%, health copay, etc.)',
      body: calculateBenefitDeductionsSchema,
      response: {
        200: benefitDeductionsResponseSchema,
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { employeeId } = request.body;

      try {
        const useCase = makeCalculateBenefitDeductionsUseCase();
        const deductionsResult = await useCase.execute({
          tenantId,
          employeeId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.BENEFIT_DEDUCTION_CALCULATE,
          entityId: employeeId,
          placeholders: {
            userName: request.user.sub,
            employeeName: employeeId,
          },
        });

        return reply.status(200).send(deductionsResult);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
