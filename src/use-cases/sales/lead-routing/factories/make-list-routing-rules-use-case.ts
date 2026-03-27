import { PrismaLeadRoutingRulesRepository } from '@/repositories/sales/prisma/prisma-lead-routing-rules-repository';
import { ListRoutingRulesUseCase } from '../list-routing-rules';

export function makeListRoutingRulesUseCase() {
  const leadRoutingRulesRepository = new PrismaLeadRoutingRulesRepository();
  return new ListRoutingRulesUseCase(leadRoutingRulesRepository);
}
