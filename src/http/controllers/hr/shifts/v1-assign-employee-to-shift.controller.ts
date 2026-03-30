import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  assignEmployeeToShiftSchema,
  idSchema,
  shiftAssignmentResponseSchema,
} from '@/http/schemas';
import { shiftAssignmentToDTO } from '@/mappers/hr/shift-assignment/shift-assignment-to-dto';
import { makeAssignEmployeeToShiftUseCase } from '@/use-cases/hr/shift-assignments/factories/make-assign-employee-to-shift-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1AssignEmployeeToShiftController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/shifts/:shiftId/assignments',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.SHIFTS.ADMIN,
        resource: 'shifts',
      }),
    ],
    schema: {
      tags: ['HR - Shifts'],
      summary: 'Assign employee to shift',
      description: 'Assigns an employee to a work shift',
      params: z.object({
        shiftId: idSchema,
      }),
      body: assignEmployeeToShiftSchema,
      response: {
        201: z.object({
          shiftAssignment: shiftAssignmentResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
        409: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { shiftId } = request.params;
      const data = request.body;

      try {
        const assignUseCase = makeAssignEmployeeToShiftUseCase();
        const { shiftAssignment } = await assignUseCase.execute({
          tenantId,
          shiftId,
          ...data,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.SHIFT_ASSIGNMENT_CREATE,
          entityId: shiftAssignment.id.toString(),
          placeholders: {
            userName: request.user.sub,
            employeeId: data.employeeId,
            shiftName: shiftId,
          },
          newData: data as Record<string, unknown>,
        });

        return reply
          .status(201)
          .send({ shiftAssignment: shiftAssignmentToDTO(shiftAssignment) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof ConflictError) {
          return reply.status(409).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
