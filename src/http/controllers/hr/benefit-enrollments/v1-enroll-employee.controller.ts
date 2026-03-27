import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  benefitEnrollmentResponseSchema,
  enrollEmployeeSchema,
} from '@/http/schemas/hr/benefits';
import { benefitEnrollmentToDTO } from '@/mappers/hr/benefit-enrollment';
import { makeEnrollEmployeeUseCase } from '@/use-cases/hr/benefit-enrollments/factories/make-enroll-employee-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1EnrollEmployeeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/benefit-enrollments',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.BENEFITS.REGISTER,
        resource: 'benefit-enrollments',
      }),
    ],
    schema: {
      tags: ['HR - Benefits'],
      summary: 'Enroll employee in benefit',
      description: 'Enrolls an employee in a benefit plan',
      body: enrollEmployeeSchema,
      response: {
        201: z.object({ enrollment: benefitEnrollmentResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const data = request.body;

      try {
        const useCase = makeEnrollEmployeeUseCase();
        const { enrollment } = await useCase.execute({
          tenantId,
          ...data,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.BENEFIT_ENROLLMENT_CREATE,
          entityId: enrollment.id.toString(),
          placeholders: {
            userName: request.user.sub,
            employeeName: enrollment.employeeId.toString(),
            planName: enrollment.benefitPlanId.toString(),
          },
          newData: data as Record<string, unknown>,
        });

        return reply.status(201).send({
          enrollment: benefitEnrollmentToDTO(enrollment),
        });
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
