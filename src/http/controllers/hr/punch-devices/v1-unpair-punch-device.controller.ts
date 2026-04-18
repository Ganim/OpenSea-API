import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  punchDeviceParamsSchema,
  unpairPunchDeviceBodySchema,
  unpairPunchDeviceResponseSchema,
} from '@/http/schemas/hr/punch/punch-device.schema';
import { makeUnpairPunchDeviceUseCase } from '@/use-cases/hr/punch-devices/factories/make-unpair-punch-device-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

/**
 * POST /v1/hr/punch-devices/:id/unpair
 * Revoga o dispositivo preenchendo `revokedAt/revokedByUserId/revokedReason`.
 * O middleware `verifyPunchDeviceToken` (Plan 3) passa a rejeitar o token
 * antigo em < 5s (PUNCH-CORE-08). Idempotente.
 *
 * Permissão: hr.punch-devices.admin
 */
export async function v1UnpairPunchDeviceController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/punch-devices/:id/unpair',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.PUNCH_DEVICES.ADMIN,
        resource: 'hr-punch-devices',
      }),
    ],
    schema: {
      tags: ['HR - Punch Devices'],
      summary: 'Revoga um dispositivo de ponto',
      description:
        'Preenche revokedAt/revokedByUserId. Token antigo é rejeitado pelo middleware de device token em < 5s.',
      params: punchDeviceParamsSchema,
      body: unpairPunchDeviceBodySchema,
      response: {
        200: unpairPunchDeviceResponseSchema,
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      try {
        const useCase = makeUnpairPunchDeviceUseCase();
        await useCase.execute({
          tenantId: request.user.tenantId!,
          deviceId: request.params.id,
          revokedByUserId: request.user.sub,
          reason: request.body?.reason,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.PUNCH_DEVICE_REVOKED,
          entityId: request.params.id,
          placeholders: {
            userName: request.user.sub,
            deviceName: request.params.id,
          },
        });

        return reply.status(200).send({ success: true });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
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
