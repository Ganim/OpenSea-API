import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  unlockPunchPinParamsSchema,
  unlockPunchPinResponseSchema,
} from '@/http/schemas/hr/punch-pin/set-punch-pin.schema';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { makeUnlockPunchPinUseCase } from '@/use-cases/hr/punch-pin/factories/make-unlock-punch-pin';

/**
 * POST /v1/hr/employees/:id/unlock-punch-pin
 *
 * Admin override for the D-11 lockout: clears lockedUntil + failedAttempts +
 * lastFailedAt. Idempotent (second call on an already-unlocked employee
 * returns 200). Audit message `PUNCH_PIN_UNLOCKED` traces who did it.
 *
 * Permissão: hr.punch-devices.admin
 */
export async function v1UnlockPunchPinController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/employees/:id/unlock-punch-pin',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.PUNCH_DEVICES.ADMIN,
        resource: 'hr-punch-pin',
      }),
    ],
    schema: {
      tags: ['HR - Punch PIN'],
      summary: 'Desbloqueia o PIN de ponto de um funcionário (admin override)',
      description:
        'Idempotente — segunda chamada em um funcionário já desbloqueado retorna 200. Zera `punchPinFailedAttempts`, `punchPinLockedUntil` e `punchPinLastFailedAt`.',
      params: unlockPunchPinParamsSchema,
      response: {
        200: unlockPunchPinResponseSchema,
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const employeeId = request.params.id;
      const userId = request.user.sub;

      try {
        const employeesRepo = new PrismaEmployeesRepository();
        const employee = await employeesRepo.findById(
          new UniqueEntityID(employeeId),
          tenantId,
        );
        if (!employee) {
          return reply
            .status(404)
            .send({ message: 'Funcionário não encontrado' });
        }

        const useCase = makeUnlockPunchPinUseCase();
        const { unlockedAt } = await useCase.execute({
          tenantId,
          employeeId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.PUNCH_PIN_UNLOCKED,
          entityId: employeeId,
          placeholders: {
            userName: userId,
            employeeName: employee.fullName,
          },
        });

        return reply.status(200).send({ unlockedAt });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
