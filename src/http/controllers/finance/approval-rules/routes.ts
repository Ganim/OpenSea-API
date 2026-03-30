import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';

import { createApprovalRuleController } from './v1-create-approval-rule.controller';
import { listApprovalRulesController } from './v1-list-approval-rules.controller';
import { getApprovalRuleByIdController } from './v1-get-approval-rule-by-id.controller';
import { updateApprovalRuleController } from './v1-update-approval-rule.controller';
import { deleteApprovalRuleController } from './v1-delete-approval-rule.controller';
import { evaluateApprovalRuleController } from './v1-evaluate-approval-rule.controller';

export async function financeApprovalRulesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('FINANCE'));

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listApprovalRulesController);
      queryApp.register(getApprovalRuleByIdController);
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.financeMutation);
      mutationApp.register(createApprovalRuleController);
      mutationApp.register(updateApprovalRuleController);
      mutationApp.register(deleteApprovalRuleController);
      mutationApp.register(evaluateApprovalRuleController);
    },
    { prefix: '' },
  );
}
