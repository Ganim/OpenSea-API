import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makePairDeviceUseCase } from '@/use-cases/sales/pos-terminals/factories/make-pair-device-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const pairDeviceBodySchema = z.object({
  pairingCode: z.string().min(6).max(6),
  deviceLabel: z.string().min(1).max(128),
});

const pairDeviceResponseSchema = z.object({
  deviceToken: z.string(),
  terminal: z.object({
    id: z.string(),
    terminalName: z.string(),
    terminalCode: z.string(),
    mode: z.string(),
  }),
});

export async function v1PairDeviceController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/pos/devices/pair',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['POS - Devices'],
      summary: 'Pair a device to a terminal using a rotating pairing code',
      body: pairDeviceBodySchema,
      response: {
        201: pairDeviceResponseSchema,
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { pairingCode, deviceLabel } = request.body;

      try {
        const useCase = makePairDeviceUseCase();
        const { deviceToken, terminal } = await useCase.execute({
          tenantId,
          pairingCode,
          deviceLabel,
          pairedByUserId: userId,
        });

        return reply.status(201).send({
          deviceToken,
          terminal: {
            id: terminal.id.toString(),
            terminalName: terminal.terminalName,
            terminalCode: terminal.terminalCode,
            mode: terminal.mode,
          },
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
