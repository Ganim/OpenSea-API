import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  benefitEnrollmentResponseSchema,
  updateEnrollmentSchema,
} from '@/http/schemas/hr/benefits';
import { cuidSchema } from '@/http/schemas/common.schema';
import { benefitEnrollmentToDTO } from '@/mappers/hr/benefit-enrollment';
import { makeUpdateEnrollmentUseCase } from '@/use-cases/hr/benefit-enrollments/factories/make-update-enrollment-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1UpdateEnrollmentController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/hr/benefit-enrollments/:enrollmentId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.BENEFITS.MODIFY,
        resource: 'benefit-enrollments',
      }),
    ],
    schema: {
      tags: ['HR - Benefits'],
      summary: 'Update benefit enrollment',
      description: 'Updates an existing benefit enrollment',
      params: z.object({ enrollmentId: cuidSchema }),
      body: updateEnrollmentSchema,
      response: {
        200: z.object({ enrollment: benefitEnrollmentResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { enrollmentId } = request.params;
      const data = request.body;

      try {
        const useCase = makeUpdateEnrollmentUseCase();
        const { enrollment } = await useCase.execute({
          tenantId,
          enrollmentId,
          ...data,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.BENEFIT_ENROLLMENT_UPDATE,
          entityId: enrollment.id.toString(),
          placeholders: {
            userName: request.user.sub,
            employeeName: enrollment.employeeId.toString(),
            planName: enrollment.benefitPlanId.toString(),
          },
          newData: data as Record<string, unknown>,
        });

        return reply.status(200).send({
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
