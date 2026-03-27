import { PrismaLeadRoutingRulesRepository } from '@/repositories/sales/prisma/prisma-lead-routing-rules-repository';
import { GetRoutingRuleByIdUseCase } from '../get-routing-rule-by-id';

export function makeGetRoutingRuleByIdUseCase() {
  const leadRoutingRulesRepository = new PrismaLeadRoutingRulesRepository();
  return new GetRoutingRuleByIdUseCase(leadRoutingRulesRepository);
}
