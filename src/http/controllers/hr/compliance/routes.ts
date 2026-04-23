import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';

import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';

import { v1GenerateAfdController } from './v1-generate-afd.controller';
import { v1GenerateAfdtController } from './v1-generate-afdt.controller';

/**
 * Phase 06 / Plan 06-02 — Aggregator das rotas de `hr/compliance`.
 *
 * Espelha o pattern de `punch-approvals/routes.ts`:
 *  - Gate de módulo `HR` via `addHook('preHandler')` — tenant precisa ter
 *    o plano com módulo HR habilitado.
 *  - Mutation routes (AFD/AFDT generate) com rate-limit estrito (mutation).
 *
 * Próximos plans 06-0x adicionarão aqui (folha-espelho, s1200-submit, listing,
 * download) — manter 1 registro por controller dentro dos blocos apropriados
 * (mutation vs query).
 */
export async function complianceRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  // Mutation routes — gerações de artefatos (escrevem no R2 + DB)
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1GenerateAfdController);
      mutationApp.register(v1GenerateAfdtController);
    },
    { prefix: '' },
  );

  // Plans 06-03/04/05/06 registrarão query routes aqui (listing, download).
}
