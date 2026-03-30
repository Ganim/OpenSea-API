import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { idSchema } from '@/http/schemas';
import { makeUnassignEmployeeFromShiftUseCase } from '@/use-cases/hr/shift-assignments/factories/make-unassign-employee-from-shift-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1UnassignEmployeeFromShiftController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/hr/shift-assignments/:assignmentId',
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
      summary: 'Unassign employee from shift',
      description: 'Deactivates a shift assignment',
      params: z.object({
        assignmentId: idSchema,
      }),
      response: {
        204: z.null(),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { assignmentId } = request.params;

      try {
        const unassignUseCase = makeUnassignEmployeeFromShiftUseCase();
        await unassignUseCase.execute({ assignmentId, tenantId });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.SHIFT_ASSIGNMENT_REMOVE,
          entityId: assignmentId,
          placeholders: {
            userName: request.user.sub,
            employeeId: assignmentId,
          },
        });

        return reply.status(204).send(null);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (
          error instanceof Error &&
          error.message.toLowerCase().includes('not found')
        ) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
