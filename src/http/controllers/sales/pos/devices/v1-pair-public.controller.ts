import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { makePairDevicePublicUseCase } from '@/use-cases/sales/pos-terminals/factories/make-pair-device-public-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const pairPublicBodySchema = z.object({
  pairingCode: z.string().min(6).max(6),
  deviceLabel: z.string().min(1).max(128),
});

const pairPublicResponseSchema = z.object({
  deviceToken: z.string(),
  terminal: z.object({
    id: z.string(),
    terminalName: z.string(),
    terminalCode: z.string(),
    mode: z.string(),
    tenantId: z.string(),
  }),
});

/**
 * Public POS device pair endpoint — used by Emporion fresh installs that have
 * no JWT yet. The 6-char rotating pairing code (printed in the RP web panel
 * by an authenticated admin) acts as the secret. Cross-tenant scan + rate
 * limit (5/min/IP, configured at the route group level).
 *
 * Decision: ADR — public pair-by-code over BFF/proxy. Code rotates every
 * minute; brute force from the same IP is bounded by the rate limiter.
 */
export async function v1PairPublicController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/pos/devices/pair-public',
    schema: {
      tags: ['POS - Devices'],
      summary:
        'Pair a device to a terminal using a rotating pairing code (no auth)',
      body: pairPublicBodySchema,
      response: {
        201: pairPublicResponseSchema,
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const { pairingCode, deviceLabel } = request.body;

      try {
        const useCase = makePairDevicePublicUseCase();
        const { deviceToken, terminal } = await useCase.execute({
          pairingCode,
          deviceLabel,
        });

        return reply.status(201).send({
          deviceToken,
          terminal: {
            id: terminal.id.toString(),
            terminalName: terminal.terminalName,
            terminalCode: terminal.terminalCode,
            mode: terminal.mode,
            tenantId: terminal.tenantId.toString(),
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
