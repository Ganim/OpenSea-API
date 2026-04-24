import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyPunchDeviceToken } from '@/http/middlewares/rbac/verify-punch-device-token';
import { makeRecordHeartbeatUseCase } from '@/use-cases/hr/punch-devices/factories/make-record-heartbeat';

const paramsSchema = z.object({ id: z.string().uuid() });

/**
 * POST /v1/hr/punch-devices/:id/heartbeat
 *
 * Endpoint do kiosk para sinal de vida. Auth: header `x-punch-device-token`
 * via `verifyPunchDeviceToken` (NÃO usa JWT — D-13 + PUNCH-CORE-08).
 *
 * Trust boundary (T-7-05b-02): após o middleware autenticar o device,
 * o controller valida que `device.id === params.id` para impedir um
 * device com token comprometido de fazer heartbeat para um deviceId
 * diferente.
 *
 * Side-effect: atualiza `PunchDevice.lastSeenAt` + `status='ONLINE'`. Reusa
 * `lastSeenAt` em vez de criar `lastHeartbeatAt` (D-13 RESOLVED — reusar
 * campo existente).
 *
 * Audit: heartbeat NÃO grava AuditLog (volume alto demais — kiosks batem
 * ~1 vez/min). Transição OFFLINE→ONLINE também não loga aqui; o
 * scheduler de Plan 07-05a registra a transição reversa (ONLINE→OFFLINE).
 */
export async function v1HeartbeatController(app: FastifyInstance) {
  app.post(
    '/v1/hr/punch-devices/:id/heartbeat',
    {
      schema: {
        tags: ['HR - Punch Devices'],
        summary: 'Heartbeat do device (sinal de vida)',
        description:
          'Auth via header x-punch-device-token. Atualiza lastSeenAt + status=ONLINE. 204 em sucesso.',
        params: paramsSchema,
      },
      preHandler: [verifyPunchDeviceToken],
    },
    async (request, reply) => {
      const params = paramsSchema.parse(request.params);
      const device = (
        request as unknown as { punchDevice?: { id: string; tenantId: string } }
      ).punchDevice;

      if (!device || device.id !== params.id) {
        return reply.status(403).send({ message: 'Device token mismatch' });
      }

      const useCase = makeRecordHeartbeatUseCase();
      try {
        await useCase.execute({
          tenantId: device.tenantId,
          deviceId: params.id,
        });
        return reply.status(204).send();
      } catch (err) {
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        throw err;
      }
    },
  );
}

/**
 * Alias com nome estável esperado por `src/http/routes.ts`. O heartbeat
 * usa device-token auth (não JWT) e portanto é registrado FORA do
 * aggregator `punchDevicesRoutes` que aplica `createModuleMiddleware('HR')`
 * (módulo middleware lê `request.user` que não existe sem JWT).
 */
export const punchDeviceHeartbeatRoutes = v1HeartbeatController;
