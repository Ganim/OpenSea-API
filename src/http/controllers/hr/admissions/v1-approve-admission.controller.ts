import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac/permission-codes';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac/verify-permission';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  admissionInviteResponseSchema,
  approveAdmissionSchema,
} from '@/http/schemas/hr/admission';
import { employeeResponseSchema } from '@/http/schemas';
import { employeeToDTO } from '@/mappers/hr/employee/employee-to-dto';
import { makeApproveAdmissionUseCase } from '@/use-cases/hr/admissions/factories/make-approve-admission-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ApproveAdmissionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/admissions/:id/approve',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.ADMISSIONS.ADMIN,
        resource: 'admissions',
      }),
    ],
    schema: {
      tags: ['HR - Admissions'],
      summary: 'Approve admission and create employee',
      description:
        'Approves the admission invite, creates an employee from the candidate data, and marks the invite as completed',
      params: z.object({ id: z.string().uuid() }),
      body: approveAdmissionSchema,
      response: {
        200: z.object({
          invite: admissionInviteResponseSchema,
          employee: employeeResponseSchema,
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
        409: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params;
      const tenantId = request.user.tenantId!;

      try {
        const useCase = makeApproveAdmissionUseCase();
        const { invite, employee } = await useCase.execute({
          tenantId,
          inviteId: id,
          registrationNumber: request.body.registrationNumber,
          weeklyHours: request.body.weeklyHours,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.ADMISSION_APPROVE,
          entityId: id,
          placeholders: {
            userName: request.user.sub,
            candidateName: invite.fullName,
            registrationNumber: request.body.registrationNumber,
          },
          newData: {
            employeeId: employee.id.toString(),
            registrationNumber: request.body.registrationNumber,
          },
        });

        return reply.status(200).send({
          invite,
          employee: employeeToDTO(employee),
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ConflictError) {
          return reply.status(409).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
