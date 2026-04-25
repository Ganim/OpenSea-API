import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { OrphanSessionExistsError } from '@/use-cases/sales/pos-sessions/open-pos-session';
import { verifyDeviceToken } from '@/http/middlewares/verify-device-token';
import { posSessionResponseSchema } from '@/http/schemas/sales/pos/pos-session.schema';
import { posSessionToDTO } from '@/mappers/sales/pos-session/pos-session-to-dto';
import { makeOpenPosSessionFromDeviceUseCase } from '@/use-cases/sales/pos-sessions/factories/make-open-pos-session-from-device-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const openPosSessionFromDeviceSchema = z.object({
  operatorEmployeeId: z.string().uuid(),
  openingBalance: z.number().min(0),
});

export async function v1OpenSessionFromDeviceController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/pos/device/sessions/open',
    preHandler: [verifyDeviceToken],
    schema: {
      tags: ['POS - Sessions'],
      summary: 'Open a POS session from a paired device (device-token auth)',
      description:
        'Device-token variant of `POST /v1/pos/sessions/open`. The terminal is taken from the device-token context; the operator is identified via `operatorEmployeeId` (must be an active operator on the terminal and have a linked user account).',
      body: openPosSessionFromDeviceSchema,
      response: {
        201: z.object({ session: posSessionResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
        409: z.object({
          message: z.string(),
          code: z.literal('ORPHAN_SESSION_EXISTS'),
          orphanSessionId: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      // `device` is set by the verifyDeviceToken preHandler — guaranteed
      // present here via the @types/fastify-pos.d.ts module augmentation.
      const device = request.device!;
      const { operatorEmployeeId, openingBalance } = request.body;

      try {
        const useCase = makeOpenPosSessionFromDeviceUseCase();
        const result = await useCase.execute({
          tenantId: device.tenantId,
          terminalId: device.terminalId,
          operatorEmployeeId,
          openingBalance,
        });

        return reply.status(201).send({
          session: posSessionToDTO(result.session),
        });
      } catch (err) {
        if (err instanceof OrphanSessionExistsError) {
          return reply.status(409).send({
            message: err.message,
            code: 'ORPHAN_SESSION_EXISTS',
            orphanSessionId: err.orphanSessionId,
          });
        }
        if (err instanceof BadRequestError) {
          return reply.status(400).send({ message: err.message });
        }
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
