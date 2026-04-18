import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listPunchDevicesQuerySchema,
  listPunchDevicesResponseSchema,
} from '@/http/schemas/hr/punch/punch-device.schema';
import { makeListPunchDevicesUseCase } from '@/use-cases/hr/punch-devices/factories/make-list-punch-devices-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

/**
 * GET /v1/hr/punch-devices
 * Lista paginada de PunchDevices do tenant. O response usa o mapper
 * `punchDeviceToDTO` que remove `pairingSecret`, `deviceTokenHash` e
 * `revokedReason` (T-04-01 / Pitfall 5).
 *
 * Permissão: hr.punch-devices.access
 */
export async function v1ListPunchDevicesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/punch-devices',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.PUNCH_DEVICES.ACCESS,
        resource: 'hr-punch-devices',
      }),
    ],
    schema: {
      tags: ['HR - Punch Devices'],
      summary: 'Lista dispositivos de ponto do tenant',
      description:
        'Retorna paginado. Filtros: deviceKind, status, includeRevoked. Resposta NÃO contém pairingSecret nem deviceTokenHash.',
      querystring: listPunchDevicesQuerySchema,
      response: {
        200: listPunchDevicesResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const useCase = makeListPunchDevicesUseCase();
      const { items, total, page, pageSize } = await useCase.execute({
        tenantId: request.user.tenantId!,
        deviceKind: request.query.deviceKind,
        status: request.query.status,
        includeRevoked: request.query.includeRevoked,
        page: request.query.page,
        pageSize: request.query.pageSize,
      });

      return reply.status(200).send({ items, total, page, pageSize });
    },
  });
}
