import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { idSchema, shiftResponseSchema, updateShiftSchema } from '@/http/schemas';
import { shiftToDTO } from '@/mappers/hr/shift/shift-to-dto';
import { makeUpdateShiftUseCase } from '@/use-cases/hr/shifts/factories/make-update-shift-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1UpdateShiftController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/hr/shifts/:shiftId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.SHIFTS.MODIFY,
        resource: 'shifts',
      }),
    ],
    schema: {
      tags: ['HR - Shifts'],
      summary: 'Update a shift',
      description: 'Updates an existing work shift',
      params: z.object({
        shiftId: idSchema,
      }),
      body: updateShiftSchema,
      response: {
        200: z.object({
          shift: shiftResponseSchema,
        }),
        400: z.object({
          message: z.string(),
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
        const updateShiftUseCase = makeUpdateShiftUseCase();
        const { shift } = await updateShiftUseCase.execute({
          shiftId,
          tenantId,
          ...data,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.SHIFT_UPDATE,
          entityId: shiftId,
          placeholders: {
            userName: request.user.sub,
            shiftName: shift.name,
          },
          newData: data as Record<string, unknown>,
        });

        return reply.status(200).send({ shift: shiftToDTO(shift) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof ConflictError) {
          return reply.status(409).send({ message: error.message });
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
