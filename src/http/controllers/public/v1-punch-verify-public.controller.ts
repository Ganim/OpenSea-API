/**
 * Rota pública de consulta de autenticidade de batida de ponto.
 * Phase 06 / Plan 06-03 (PUNCH-COMPLIANCE-04).
 *
 * ⚠️  Acesso totalmente anônimo (sem JWT, sem tenant, sem handler de auth).
 * A rota é protegida por:
 *   - Zod regex no path param (bloqueia path traversal + enumeração).
 *   - Rate limit 30 req/min por IP — configurado INLINE neste controller
 *     (defesa-em-profundidade, CR-04). O wrapper externo em `routes.ts`
 *     mantém a camada adicional, mas a proteção segue junto do controller
 *     se este for registrado em outro contexto.
 *   - `keyGenerator` usa `X-Forwarded-For` quando presente, caindo de volta
 *     para `request.ip` — necessário em ambientes atrás de proxy reverso
 *     (Fly.io) onde `request.ip` é o IP do load balancer.
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

import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { rateLimitConfig } from '@/config/rate-limits';
import {
  punchVerifyPublicParamsSchema,
  punchVerifyPublicResponseSchema,
} from '@/http/schemas/hr/compliance/punch-verify-public.schema';
import { makeFindTimeEntryByReceiptHashUseCase } from '@/use-cases/hr/compliance/factories/make-find-time-entry-by-receipt-hash';

function resolveClientIp(req: FastifyRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) {
    const first = fwd.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.ip ?? 'unknown';
}

export async function v1PunchVerifyPublicController(app: FastifyInstance) {
  // Defense-in-depth rate-limit (CR-04). Aplicado num encapsulamento próprio
  // para não afetar outras rotas do mesmo pai caso este controller seja
  // reutilizado em outro prefix/contexto de teste.
  await app.register(async (scoped) => {
    await scoped.register(rateLimit, {
      max: rateLimitConfig.signaturePublicVerify.max,
      timeWindow: rateLimitConfig.signaturePublicVerify.timeWindow,
      keyGenerator: (req) => resolveClientIp(req as FastifyRequest),
    });

    scoped.withTypeProvider<ZodTypeProvider>().route({
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
          accessedFromIp: resolveClientIp(request),
          accessedByUserAgent:
            (request.headers['user-agent'] as string | undefined) ?? null,
        });

        if (!result) {
          return reply.status(404).send({ message: 'Batida não encontrada' });
        }

        return reply.status(200).send(result);
      },
    });
  });
}
