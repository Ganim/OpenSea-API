import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { WeakPinError } from '@/@errors/use-cases/weak-pin-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  setPunchPinBodySchema,
  setPunchPinParamsSchema,
  setPunchPinResponseSchema,
} from '@/http/schemas/hr/punch-pin/set-punch-pin.schema';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { makeSetPunchPinUseCase } from '@/use-cases/hr/punch-pin/factories/make-set-punch-pin';

/**
 * POST /v1/hr/employees/:id/punch-pin
 *
 * Admin defines or replaces an employee's PIN of ponto (D-08). Accepts a
 * 6-digit PIN in the body; rejects the 11 WEAK_PINS_BLOCKLIST sequences with
 * 400 (WeakPinError → `{ message }`). The plaintext PIN is NEVER logged nor
 * echoed back — the response carries only `setAt`.
 *
 * Permissão: hr.punch-devices.admin
 */
export async function v1SetPunchPinController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/employees/:id/punch-pin',
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
      summary: 'Define ou altera o PIN de ponto de um funcionário',
      description:
        'Admin só. Gera `bcrypt(pin, 10)`; bloqueia as 11 sequências óbvias (000000..999999 e 123456) com 400. Limpa qualquer lockout pendente no mesmo call.',
      params: setPunchPinParamsSchema,
      body: setPunchPinBodySchema,
      response: {
        200: setPunchPinResponseSchema,
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const employeeId = request.params.id;
      const userId = request.user.sub;
      const { pin } = request.body;

      try {
        // Look up the employee up-front so the audit message carries the name.
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

        const useCase = makeSetPunchPinUseCase();
        const { setAt } = await useCase.execute({
          tenantId,
          employeeId,
          pin,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.PUNCH_PIN_SET,
          entityId: employeeId,
          placeholders: {
            userName: userId,
            employeeName: employee.fullName,
          },
        });

        return reply.status(200).send({ setAt });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof WeakPinError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
