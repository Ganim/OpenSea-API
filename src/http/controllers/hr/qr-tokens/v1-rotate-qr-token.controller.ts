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
  rotateQrTokenParamsSchema,
  rotateQrTokenResponseSchema,
} from '@/http/schemas/hr/qr-token/rotate-qr-token.schema';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { makeRotateQrTokenUseCase } from '@/use-cases/hr/qr-tokens/factories/make-rotate-qr-token';

/**
 * POST /v1/hr/employees/:id/qr-token/rotate
 *
 * Individual sync QR rotation (D-14 single). Admin gets back the plaintext
 * token ONCE — it is never logged or persisted beyond the hash on
 * `Employee.qrTokenHash`. Old hash is discarded: the previous crachá stops
 * resolving at the next kiosk scan.
 *
 * Permissão: hr.punch-devices.admin
 */
export async function v1RotateQrTokenController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/employees/:id/qr-token/rotate',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.PUNCH_DEVICES.ADMIN,
        resource: 'hr-qr-tokens',
      }),
    ],
    schema: {
      tags: ['HR - QR Tokens'],
      summary: 'Rotaciona o QR do crachá de um funcionário (síncrono)',
      description:
        'Gera um novo token 32 bytes (64 hex) e persiste `sha256(token)` em `Employee.qrTokenHash`. O token plaintext é retornado UMA ÚNICA VEZ para o admin imprimir o crachá. O crachá antigo deixa de funcionar imediatamente.',
      params: rotateQrTokenParamsSchema,
      response: {
        200: rotateQrTokenResponseSchema,
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const employeeId = request.params.id;
      const userId = request.user.sub;

      try {
        // Lookup employee up-front so the audit message carries its name.
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

        const useCase = makeRotateQrTokenUseCase();
        const { token, rotatedAt } = await useCase.execute({
          tenantId,
          employeeId,
          rotatedByUserId: userId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.PUNCH_QR_TOKEN_ROTATED,
          entityId: employeeId,
          placeholders: {
            userName: userId,
            employeeName: employee.fullName,
          },
        });

        return reply.status(200).send({ token, rotatedAt });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
