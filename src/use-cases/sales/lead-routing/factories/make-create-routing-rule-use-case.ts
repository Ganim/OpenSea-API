import { PrismaLeadRoutingRulesRepository } from '@/repositories/sales/prisma/prisma-lead-routing-rules-repository';
import { CreateRoutingRuleUseCase } from '../create-routing-rule';

export function makeCreateRoutingRuleUseCase() {
  const leadRoutingRulesRepository = new PrismaLeadRoutingRulesRepository();
  return new CreateRoutingRuleUseCase(leadRoutingRulesRepository);
}
