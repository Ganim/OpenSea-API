import { PrismaCustomersRepository } from '@/repositories/sales/prisma/prisma-customers-repository';
import { PrismaDealsRepository } from '@/repositories/sales/prisma/prisma-deals-repository';
import { PrismaLeadRoutingRulesRepository } from '@/repositories/sales/prisma/prisma-lead-routing-rules-repository';
import { RouteLeadUseCase } from '../route-lead';

export function makeRouteLeadUseCase() {
  const leadRoutingRulesRepository = new PrismaLeadRoutingRulesRepository();
  const customersRepository = new PrismaCustomersRepository();
  const dealsRepository = new PrismaDealsRepository();
  return new RouteLeadUseCase(
    leadRoutingRulesRepository,
    customersRepository,
    dealsRepository,
  );
}
