import { env } from '@/@env';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

/**
 * GET /v1/public/vapid-key
 *
 * Phase 8 / Plan 08-01 — A1 resolution.
 *
 * Retorna a VAPID public key configurada no backend para que a PWA pessoal
 * (e qualquer outro cliente Web Push) possa fazer subscribe sem precisar de
 * `NEXT_PUBLIC_VAPID_PUBLIC_KEY` no frontend. A chave pública por design
 * NÃO é segredo (RFC 8292) — admin só seta o backend env, mais ergonômico.
 *
 * Sem auth, sem rate-limit (chave pública pode ser cached forever pelo browser).
 *
 * Quando `VAPID_PUBLIC_KEY` não está configurada, retorna 503 — frontend
 * propaga erro visível ao usuário (CLAUDE.md regra 2: never silent fallback).
 */
export async function v1GetVapidPublicKeyController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/public/vapid-key',
    schema: {
      tags: ['Public'],
      summary: 'Retorna VAPID public key para subscription Web Push',
      description:
        'Endpoint público (sem auth) que devolve a VAPID public key do backend. ' +
        'Usado pela PWA pessoal (sw-punch.js) e potencialmente por outros clientes ' +
        'Web Push. RFC 8292: public key não é segredo. Quando ausente no env retorna 503.',
      response: {
        200: z.object({ publicKey: z.string() }),
        503: z.object({ message: z.string() }),
      },
    },
    handler: async (_request, reply) => {
      const publicKey = env.VAPID_PUBLIC_KEY;
      if (!publicKey) {
        return reply
          .status(503)
          .send({ message: 'VAPID not configured on this server' });
      }
      return reply.status(200).send({ publicKey });
    },
  });
}
