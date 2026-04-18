import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  getPunchDevicePairingCodeResponseSchema,
  punchDeviceParamsSchema,
} from '@/http/schemas/hr/punch/punch-device.schema';
import { makeGetPunchDevicePairingCodeUseCase } from '@/use-cases/hr/punch-devices/factories/make-get-punch-device-pairing-code-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

/**
 * GET /v1/hr/punch-devices/:id/pairing-code
 * Retorna o código TOTP corrente (6 chars alfanuméricos, 60s de rotação) para
 * o admin digitar no setup do dispositivo. Rejeita devices já pareados ou
 * revogados.
 *
 * Permissão: hr.punch-devices.admin
 */
export async function v1GetPunchDevicePairingCodeController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/punch-devices/:id/pairing-code',
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
      summary: 'Obtém código TOTP atual para pareamento',
      description:
        'Código de 6 chars que rotaciona a cada 60s. O operador digita na tela do dispositivo durante setup.',
      params: punchDeviceParamsSchema,
      response: {
        200: getPunchDevicePairingCodeResponseSchema,
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      try {
        const useCase = makeGetPunchDevicePairingCodeUseCase();
        const { code, expiresAt } = await useCase.execute({
          tenantId: request.user.tenantId!,
          deviceId: request.params.id,
        });

        return reply.status(200).send({
          code,
          expiresAt: expiresAt.toISOString(),
        });
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
