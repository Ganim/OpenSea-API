import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyDeviceToken } from '@/http/middlewares/verify-device-token';
import { makeHeartbeatDeviceUseCase } from '@/use-cases/sales/pos-terminals/factories/make-heartbeat-device-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const heartbeatBody = z.object({
  appVersion: z
    .string()
    .min(1)
    .max(32)
    .regex(/^[\w.+-]+$/)
    .optional(),
});

export async function v1HeartbeatDeviceController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/pos/device/heartbeat',
    preHandler: [verifyDeviceToken],
    schema: {
      tags: ['POS - Terminals'],
      summary:
        'Update lastSeenAt + appVersion for the calling device (heartbeat)',
      body: heartbeatBody,
      response: {
        204: z.null(),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const device = request.device!;
      try {
        const useCase = makeHeartbeatDeviceUseCase();
        await useCase.execute({
          deviceId: device.terminalId,
          appVersion: request.body.appVersion,
        });
        return reply.status(204).send(null);
      } catch (err) {
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
