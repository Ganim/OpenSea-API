import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  registerPunchDeviceBodySchema,
  registerPunchDeviceResponseSchema,
} from '@/http/schemas/hr/punch/punch-device.schema';
import { makeRegisterPunchDeviceUseCase } from '@/use-cases/hr/punch-devices/factories/make-register-punch-device-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

/**
 * POST /v1/hr/punch-devices
 * Cadastra um novo dispositivo de ponto (kiosk, PWA pessoal, leitor biométrico,
 * WebAuthn PC) e retorna `pairingSecret` UMA única vez (one-time). Admin deve
 * armazenar imediatamente — leituras subsequentes redigem o campo (Pitfall 5 /
 * T-04-01).
 *
 * Permissão: hr.punch-devices.register
 */
export async function v1RegisterPunchDeviceController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/punch-devices',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.PUNCH_DEVICES.REGISTER,
        resource: 'hr-punch-devices',
      }),
    ],
    schema: {
      tags: ['HR - Punch Devices'],
      summary: 'Cadastra novo dispositivo de ponto',
      description:
        'Cria um PunchDevice e retorna pairingSecret (64 hex) UMA única vez. Use GET /:id/pairing-code + POST /:id/pair para completar o pareamento.',
      body: registerPunchDeviceBodySchema,
      response: {
        201: registerPunchDeviceResponseSchema,
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      try {
        const useCase = makeRegisterPunchDeviceUseCase();
        const { deviceId, pairingSecret } = await useCase.execute({
          tenantId: request.user.tenantId!,
          name: request.body.name,
          deviceKind: request.body.deviceKind,
          geofenceZoneId: request.body.geofenceZoneId,
          allowedEmployeeIds: request.body.allowedEmployeeIds,
          allowedDepartmentIds: request.body.allowedDepartmentIds,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.PUNCH_DEVICE_CREATED,
          entityId: deviceId,
          placeholders: {
            userName: request.user.sub,
            deviceName: request.body.name,
            deviceKind: request.body.deviceKind,
          },
        });

        return reply.status(201).send({ deviceId, pairingSecret });
      } catch (error) {
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
