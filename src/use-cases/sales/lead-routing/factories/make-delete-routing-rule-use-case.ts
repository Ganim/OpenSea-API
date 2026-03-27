import { PrismaLeadRoutingRulesRepository } from '@/repositories/sales/prisma/prisma-lead-routing-rules-repository';
import { DeleteRoutingRuleUseCase } from '../delete-routing-rule';

export function makeDeleteRoutingRuleUseCase() {
  const leadRoutingRulesRepository = new PrismaLeadRoutingRulesRepository();
  return new DeleteRoutingRuleUseCase(leadRoutingRulesRepository);
}
