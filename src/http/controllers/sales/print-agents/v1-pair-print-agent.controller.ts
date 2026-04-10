import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import {
  pairPrintAgentBodySchema,
  pairPrintAgentResponseSchema,
} from '@/http/schemas/sales/printing/print-agent.schema';
import { makePairPrintAgentUseCase } from '@/use-cases/sales/print-agents/factories/make-pair-print-agent-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

/**
 * PUBLIC endpoint — no JWT or tenant middleware required.
 * The pairing code itself is the authentication mechanism:
 * - TOTP-based, 6-char, 120s window, 32-byte random secret per agent
 * - Globally unique across all tenants (collision probability negligible)
 * - The agent desktop app calls this after the user types the code displayed in the browser
 */
export async function v1PairPrintAgentController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/sales/print-agents/pair',
    schema: {
      tags: ['Sales - Printing'],
      summary: 'Pair a device with a print agent using pairing code',
      description:
        'Public endpoint. Validates the 6-character TOTP pairing code against all unpaired agents across all tenants. If matched, generates a device token for future WebSocket authentication.',
      body: pairPrintAgentBodySchema,
      response: {
        200: pairPrintAgentResponseSchema,
        400: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      try {
        const useCase = makePairPrintAgentUseCase();
        const { deviceToken, agentId, agentName } = await useCase.execute({
          pairingCode: request.body.pairingCode,
          hostname: request.body.hostname,
        });

        return reply.status(200).send({
          deviceToken,
          agentId,
          agentName,
        });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }

        throw error;
      }
    },
  });
}
