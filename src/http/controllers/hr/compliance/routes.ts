import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';

import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';

import { v1BuildS1200Controller } from './v1-build-s1200.controller';
import { v1GenerateAfdController } from './v1-generate-afd.controller';
import { v1GenerateAfdtController } from './v1-generate-afdt.controller';
import { v1GenerateFolhaEspelhoController } from './v1-generate-folha-espelho.controller';
import { v1GenerateFolhaEspelhoBulkController } from './v1-generate-folha-espelho-bulk.controller';
import { v1ListRubricaMapController } from './v1-list-rubrica-map.controller';
import { v1UpsertRubricaMapController } from './v1-upsert-rubrica-map.controller';

/**
 * Phase 06 / Plan 06-02 — Aggregator das rotas de `hr/compliance`.
 *
 * Espelha o pattern de `punch-approvals/routes.ts`:
 *  - Gate de módulo `HR` via `addHook('preHandler')` — tenant precisa ter
 *    o plano com módulo HR habilitado.
 *  - Mutation routes (AFD/AFDT generate) com rate-limit estrito (mutation).
 *
 * Plan 06-05 adicionou rotas de RubricaMap (query + mutation) e o endpoint
 * de submissão de S-1200 (mutation).
 */
export async function complianceRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  // Mutation routes — gerações de artefatos (escrevem no R2 + DB)
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1GenerateAfdController);
      mutationApp.register(v1GenerateAfdtController);
      // Plan 06-04 — folha espelho individual + bulk
      mutationApp.register(v1GenerateFolhaEspelhoController);
      mutationApp.register(v1GenerateFolhaEspelhoBulkController);
      // Plan 06-05 — upsert de mapeamento CLT → codRubr
      mutationApp.register(v1UpsertRubricaMapController);
      // Plan 06-05 — geração de eventos S-1200 (Remuneração do Trabalhador)
      mutationApp.register(v1BuildS1200Controller);
    },
    { prefix: '' },
  );

  // Query routes — listagens (leitura)
  app.register(async (queryApp) => {
    queryApp.register(v1ListRubricaMapController);
  });
}
