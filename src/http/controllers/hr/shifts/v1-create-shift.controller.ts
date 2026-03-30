import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { createShiftSchema, shiftResponseSchema } from '@/http/schemas';
import { shiftToDTO } from '@/mappers/hr/shift/shift-to-dto';
import { makeCreateShiftUseCase } from '@/use-cases/hr/shifts/factories/make-create-shift-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CreateShiftController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/shifts',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.SHIFTS.REGISTER,
        resource: 'shifts',
      }),
    ],
    schema: {
      tags: ['HR - Shifts'],
      summary: 'Create a shift',
      description: 'Creates a new work shift',
      body: createShiftSchema,
      response: {
        201: z.object({
          shift: shiftResponseSchema,
        }),
        400: z.object({
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
        const createShiftUseCase = makeCreateShiftUseCase();
        const { shift } = await createShiftUseCase.execute({
          ...data,
          tenantId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.SHIFT_CREATE,
          entityId: shift.id.toString(),
          placeholders: {
            userName: request.user.sub,
            shiftName: shift.name,
          },
          newData: data as Record<string, unknown>,
        });

        return reply.status(201).send({ shift: shiftToDTO(shift) });
      } catch (error) {
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
