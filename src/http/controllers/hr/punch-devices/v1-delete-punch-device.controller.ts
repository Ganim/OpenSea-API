import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  deletePunchDeviceResponseSchema,
  punchDeviceParamsSchema,
} from '@/http/schemas/hr/punch/punch-device.schema';
import { makeDeletePunchDeviceUseCase } from '@/use-cases/hr/punch-devices/factories/make-delete-punch-device-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

/**
 * DELETE /v1/hr/punch-devices/:id
 * Soft-delete de PunchDevice. A linha fica no banco com `deletedAt` preenchido
 * (preserva rastro com TimeEntry/NSR para Portaria 671). list/get retornam
 * 404 e o middleware rejeita qualquer token antigo.
 *
 * Permissão: hr.punch-devices.remove
 */
export async function v1DeletePunchDeviceController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/hr/punch-devices/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.PUNCH_DEVICES.REMOVE,
        resource: 'hr-punch-devices',
      }),
    ],
    schema: {
      tags: ['HR - Punch Devices'],
      summary: 'Exclui (soft-delete) um dispositivo de ponto',
      description:
        'A linha permanece no banco com deletedAt preenchido para preservar auditoria Portaria 671.',
      params: punchDeviceParamsSchema,
      response: {
        200: deletePunchDeviceResponseSchema,
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      try {
        const useCase = makeDeletePunchDeviceUseCase();
        await useCase.execute({
          tenantId: request.user.tenantId!,
          deviceId: request.params.id,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.PUNCH_DEVICE_DELETED,
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
