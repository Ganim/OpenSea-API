import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyDeviceToken } from '@/http/middlewares/verify-device-token';
import { posSessionResponseSchema } from '@/http/schemas/sales/pos/pos-session.schema';
import { posSessionToDTO } from '@/mappers/sales/pos-session/pos-session-to-dto';
import { makeClosePosSessionFromDeviceUseCase } from '@/use-cases/sales/pos-sessions/factories/make-close-pos-session-from-device-use-case';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import type { VerifiedDeviceContext } from '@/http/middlewares/verify-device-token';

const closePosSessionFromDeviceSchema = z.object({
  performedByEmployeeId: z.string().uuid(),
  closingBalance: z.number().min(0),
  closingBreakdown: z
    .object({
      cash: z.number().optional(),
      creditCard: z.number().optional(),
      debitCard: z.number().optional(),
      pix: z.number().optional(),
      checks: z.number().optional(),
      other: z.number().optional(),
    })
    .optional(),
  notes: z.string().optional(),
});

export async function v1CloseSessionFromDeviceController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/pos/device/sessions/:sessionId/close',
    preHandler: [verifyDeviceToken],
    schema: {
      tags: ['POS - Sessions'],
      summary: 'Close a POS session from a paired device (device-token auth)',
      params: z.object({ sessionId: z.string().uuid() }),
      body: closePosSessionFromDeviceSchema,
      response: {
        200: z.object({ session: posSessionResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const { device } = request as FastifyRequest & {
        device: VerifiedDeviceContext;
      };
      const { sessionId } = request.params;
      const data = request.body;

      try {
        const useCase = makeClosePosSessionFromDeviceUseCase();
        const result = await useCase.execute({
          tenantId: device.tenantId,
          terminalId: device.terminalId,
          sessionId,
          ...data,
        });

        return reply.send({
          session: posSessionToDTO(result.session),
        });
      } catch (err) {
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
