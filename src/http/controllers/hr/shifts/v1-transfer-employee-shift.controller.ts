import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  shiftAssignmentResponseSchema,
  transferEmployeeShiftSchema,
} from '@/http/schemas';
import { shiftAssignmentToDTO } from '@/mappers/hr/shift-assignment/shift-assignment-to-dto';
import { makeTransferEmployeeShiftUseCase } from '@/use-cases/hr/shift-assignments/factories/make-transfer-employee-shift-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1TransferEmployeeShiftController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/shift-assignments/transfer',
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
      summary: 'Transfer employee to another shift',
      description:
        'Transfers an employee from their current shift to a new one',
      body: transferEmployeeShiftSchema,
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
      const data = request.body;

      try {
        const transferUseCase = makeTransferEmployeeShiftUseCase();
        const { newAssignment } = await transferUseCase.execute({
          tenantId,
          ...data,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.SHIFT_ASSIGNMENT_TRANSFER,
          entityId: newAssignment.id.toString(),
          placeholders: {
            userName: request.user.sub,
            employeeId: data.employeeId,
            shiftName: data.newShiftId,
          },
          newData: data as Record<string, unknown>,
        });

        return reply
          .status(201)
          .send({ shiftAssignment: shiftAssignmentToDTO(newAssignment) });
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
