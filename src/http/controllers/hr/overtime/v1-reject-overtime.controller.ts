import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  idSchema,
  rejectOvertimeSchema,
  overtimeResponseSchema,
} from '@/http/schemas';
import { overtimeToDTO } from '@/mappers/hr/overtime/overtime-to-dto';
import { makeRejectOvertimeUseCase } from '@/use-cases/hr/overtime/factories/make-reject-overtime-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1RejectOvertimeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/hr/overtime/:overtimeId/reject',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.TIME_CONTROL.ACCESS,
        resource: 'overtime',
      }),
    ],
    schema: {
      tags: ['HR - Overtime'],
      summary: 'Reject overtime',
      description: 'Rejects an overtime request with an optional reason',
      params: z.object({
        overtimeId: idSchema,
      }),
      body: rejectOvertimeSchema,
      response: {
        200: z.object({
          overtime: overtimeResponseSchema,
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
      const { overtimeId } = request.params;
      const { rejectionReason } = request.body;
      const rejectedById = request.user.sub;

      try {
        const rejectOvertimeUseCase = makeRejectOvertimeUseCase();
        const { overtime } = await rejectOvertimeUseCase.execute({
          tenantId,
          overtimeId,
          rejectedBy: rejectedById,
          rejectionReason,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.OVERTIME_REJECT,
          entityId: overtimeId,
          placeholders: {
            userName: rejectedById,
            hours: String(overtime.hours),
            employeeName: overtime.employeeId.toString(),
          },
        });

        return reply.status(200).send({ overtime: overtimeToDTO(overtime) });
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
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
