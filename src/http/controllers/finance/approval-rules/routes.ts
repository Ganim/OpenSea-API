import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';

import { createApprovalRuleController } from './v1-create-approval-rule.controller';
import { listApprovalRulesController } from './v1-list-approval-rules.controller';
import { getApprovalRuleByIdController } from './v1-get-approval-rule-by-id.controller';
import { updateApprovalRuleController } from './v1-update-approval-rule.controller';
import { deleteApprovalRuleController } from './v1-delete-approval-rule.controller';
import { evaluateApprovalRuleController } from './v1-evaluate-approval-rule.controller';

export async function financeApprovalRulesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('FINANCE'));

  app.register(createApprovalRuleController);
  app.register(listApprovalRulesController);
  app.register(getApprovalRuleByIdController);
  app.register(updateApprovalRuleController);
  app.register(deleteApprovalRuleController);
  app.register(evaluateApprovalRuleController);
}
