/**
 * Rota pública de consulta de autenticidade de batida de ponto.
 * Phase 06 / Plan 06-03 (PUNCH-COMPLIANCE-04).
 *
 * ⚠️  Acesso totalmente anônimo (sem JWT, sem tenant, sem handler de auth).
 * A rota é protegida apenas por:
 *   - Zod regex no path param (bloqueia path traversal + enumeração).
 *   - Rate limit 30 req/min por IP (configurado no wrapper `routes.ts`).
 *   - HMAC-SHA256 com RECEIPT_HMAC_KEY 32 bytes — 2^256 search space
 *     torna brute-force impraticável.
 *   - Audit log em `ComplianceVerifyLog` (FOUND/NOT_FOUND) para
 *     investigação forense.
 *
 * LGPD: use case resolve apenas campos whitelist (mapper aplica a
 * filtragem final). Campos proibidos (documentos, e-mail, endereço,
 * telefone, GPS, foto, face metadata) NUNCA aparecem no response.
 * Sentinelas de e2e verificam isso literalmente.
 */

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import {
  punchVerifyPublicParamsSchema,
  punchVerifyPublicResponseSchema,
} from '@/http/schemas/hr/compliance/punch-verify-public.schema';
import { makeFindTimeEntryByReceiptHashUseCase } from '@/use-cases/hr/compliance/factories/make-find-time-entry-by-receipt-hash';

export async function v1PunchVerifyPublicController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/verify/:nsrHash',
    schema: {
      tags: ['Public — Punch Verify'],
      summary:
        'Consulta pública de autenticidade de batida de ponto (sem auth, rate-limited 30/min, whitelist LGPD).',
      description:
        'Retorna dados mínimos (nome, razão social, CNPJ mascarado, data/hora, NSR, tipo, status). ' +
        'Portaria MTP 671/2021. Nunca expõe CPF, matrícula, e-mail, endereço, telefone, GPS ou foto.',
      params: punchVerifyPublicParamsSchema,
      response: {
        200: punchVerifyPublicResponseSchema,
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
        429: z.object({ message: z.string() }),
      },
    },

    handler: async (request, reply) => {
      const useCase = makeFindTimeEntryByReceiptHashUseCase();
      const result = await useCase.execute({
        nsrHash: request.params.nsrHash,
        accessedFromIp: request.ip ?? null,
        accessedByUserAgent:
          (request.headers['user-agent'] as string | undefined) ?? null,
      });

      if (!result) {
        return reply.status(404).send({ message: 'Batida não encontrada' });
      }

      return reply.status(200).send(result);
    },
  });
}
