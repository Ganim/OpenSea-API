/**
 * POST /v1/hr/punch-bio/notify-update-failed
 *
 * Called by a paired Punch-Agent when electron-updater fails to auto-update.
 * Dispatches a `punch.agent_update_failed` notification to tenant admins.
 *
 * Auth: x-punch-device-token header (verifyPunchDeviceToken middleware).
 *   - No JWT required — the agent authenticates with its device token only.
 *   - T-10-06-05: token is validated + revocation-checked per request.
 *
 * Body: strict() — unknown fields rejected (T-10-06-07 DoS defence).
 * Message: max 200 chars (T-10-06-03 LGPD — error may contain PII).
 *
 * Plan 10-06 Task 6.4.
 */
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { verifyPunchDeviceToken } from '@/http/middlewares/rbac/verify-punch-device-token';
import { prisma } from '@/lib/prisma';
import { notificationClient } from '@/modules/notifications/public/client';
import {
  NotifyUpdateFailedUseCase,
  type NotifyUpdateFailedPrisma,
  type NotifyUpdateFailedNotificationClient,
} from '@/use-cases/hr/punch-bio/notify-update-failed';

function makeNotifyUpdateFailedUseCase() {
  const prismaDeps: NotifyUpdateFailedPrisma = {
    permissionGroup: {
      findMany: (args) =>
        prisma.permissionGroup.findMany(
          args as Parameters<typeof prisma.permissionGroup.findMany>[0],
        ),
    },
    punchDevice: {
      findUnique: (args) =>
        prisma.punchDevice.findUnique(
          args as Parameters<typeof prisma.punchDevice.findUnique>[0],
        ),
    },
  };

  const notifDeps: NotifyUpdateFailedNotificationClient = {
    dispatch: (input) => notificationClient.dispatch(input),
  };

  return new NotifyUpdateFailedUseCase(prismaDeps, notifDeps);
}

export async function v1NotifyUpdateFailedController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/punch-bio/notify-update-failed',
    preHandler: [verifyPunchDeviceToken],
    schema: {
      tags: ['HR - Punch Bio'],
      summary: 'Notificar falha de auto-update do agente biométrico',
      description:
        'Chamado pelo Punch-Agent quando o electron-updater falha ao baixar ou instalar uma atualização. ' +
        'Autentica via x-punch-device-token. Despacha notificação punch.agent_update_failed para admins do tenant.',
      body: z
        .object({
          deviceId: z.string().uuid(),
          // T-10-06-03: max 200 chars enforced at schema level
          message: z.string().max(200),
        })
        .strict(),
      response: {
        200: z.object({ ok: z.literal(true) }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.punchDevice!.tenantId;
      const { deviceId, message } = request.body;

      const useCase = makeNotifyUpdateFailedUseCase();
      await useCase.execute({ tenantId, deviceId, message });

      return reply.status(200).send({ ok: true });
    },
  });
}
