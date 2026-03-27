import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  benefitEnrollmentResponseSchema,
  bulkEnrollSchema,
} from '@/http/schemas/hr/benefits';
import { benefitEnrollmentToDTO } from '@/mappers/hr/benefit-enrollment';
import { makeBulkEnrollUseCase } from '@/use-cases/hr/benefit-enrollments/factories/make-bulk-enroll-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1BulkEnrollController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/benefit-enrollments/bulk',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.BENEFITS.ADMIN,
        resource: 'benefit-enrollments',
      }),
    ],
    schema: {
      tags: ['HR - Benefits'],
      summary: 'Bulk enroll employees',
      description: 'Enrolls multiple employees in a benefit plan at once',
      body: bulkEnrollSchema,
      response: {
        201: z.object({
          enrollments: z.array(benefitEnrollmentResponseSchema),
          failedEmployeeIds: z.array(z.string()),
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const data = request.body;

      try {
        const useCase = makeBulkEnrollUseCase();
        const { enrollments, failedEmployeeIds } = await useCase.execute({
          tenantId,
          ...data,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.BENEFIT_ENROLLMENT_BULK,
          entityId: data.benefitPlanId,
          placeholders: {
            userName: request.user.sub,
            count: String(enrollments.length),
            planName: data.benefitPlanId,
          },
          newData: data as Record<string, unknown>,
        });

        return reply.status(201).send({
          enrollments: enrollments.map(benefitEnrollmentToDTO),
          failedEmployeeIds,
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
