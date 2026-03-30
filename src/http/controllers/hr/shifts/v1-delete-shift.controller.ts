import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { idSchema } from '@/http/schemas';
import { makeDeleteShiftUseCase } from '@/use-cases/hr/shifts/factories/make-delete-shift-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1DeleteShiftController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/hr/shifts/:shiftId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.SHIFTS.REMOVE,
        resource: 'shifts',
      }),
    ],
    schema: {
      tags: ['HR - Shifts'],
      summary: 'Delete a shift',
      description: 'Soft deletes a work shift',
      params: z.object({
        shiftId: idSchema,
      }),
      response: {
        204: z.null(),
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
      const { shiftId } = request.params;

      try {
        const deleteShiftUseCase = makeDeleteShiftUseCase();
        await deleteShiftUseCase.execute({ shiftId, tenantId });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.SHIFT_DELETE,
          entityId: shiftId,
          placeholders: {
            userName: request.user.sub,
            shiftName: shiftId,
          },
        });

        return reply.status(204).send(null);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
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
