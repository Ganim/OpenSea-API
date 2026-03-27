import { PrismaLeadRoutingRulesRepository } from '@/repositories/sales/prisma/prisma-lead-routing-rules-repository';
import { UpdateRoutingRuleUseCase } from '../update-routing-rule';

export function makeUpdateRoutingRuleUseCase() {
  const leadRoutingRulesRepository = new PrismaLeadRoutingRulesRepository();
  return new UpdateRoutingRuleUseCase(leadRoutingRulesRepository);
}
