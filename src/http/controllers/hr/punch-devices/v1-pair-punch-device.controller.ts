import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  pairPunchDeviceBodySchema,
  pairPunchDeviceResponseSchema,
  punchDeviceParamsSchema,
} from '@/http/schemas/hr/punch/punch-device.schema';
import { makePairPunchDeviceUseCase } from '@/use-cases/hr/punch-devices/factories/make-pair-punch-device-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

/**
 * POST /v1/hr/punch-devices/:id/pair
 * Completa o pareamento de um dispositivo. Admin fornece o código TOTP que
 * aparece na tela do dispositivo e recebe `deviceToken` (64 hex) UMA vez —
 * o cliente armazena e envia no header `x-punch-device-token` em batidas
 * futuras.
 *
 * Permissão: hr.punch-devices.admin
 */
export async function v1PairPunchDeviceController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/punch-devices/:id/pair',
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
      summary: 'Completa pareamento via código TOTP',
      description:
        'Valida o código TOTP, gera deviceToken (64 hex) e persiste SHA-256(deviceToken). O plaintext retorna UMA única vez.',
      params: punchDeviceParamsSchema,
      body: pairPunchDeviceBodySchema,
      response: {
        200: pairPunchDeviceResponseSchema,
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      try {
        const useCase = makePairPunchDeviceUseCase();
        const { deviceToken, deviceId, deviceName } = await useCase.execute({
          tenantId: request.user.tenantId!,
          deviceId: request.params.id,
          pairingCode: request.body.pairingCode,
          hostname: request.body.hostname,
          pairedByUserId: request.user.sub,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.PUNCH_DEVICE_PAIRED,
          entityId: deviceId,
          placeholders: {
            userName: request.user.sub,
            deviceName,
            hostname: request.body.hostname,
          },
        });

        return reply.status(200).send({ deviceToken, deviceId, deviceName });
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
