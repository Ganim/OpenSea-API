import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { listScoringRulesController } from './v1-list-scoring-rules.controller';
import { createScoringRuleController } from './v1-create-scoring-rule.controller';
import { updateScoringRuleController } from './v1-update-scoring-rule.controller';
import { deleteScoringRuleController } from './v1-delete-scoring-rule.controller';
import { calculateLeadScoreController } from './v1-calculate-lead-score.controller';
import { bulkRecalculateScoresController } from './v1-bulk-recalculate-scores.controller';

export async function leadScoringRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  await app.register(listScoringRulesController);
  await app.register(createScoringRuleController);
  await app.register(updateScoringRuleController);
  await app.register(deleteScoringRuleController);
  await app.register(calculateLeadScoreController);
  await app.register(bulkRecalculateScoresController);
}
