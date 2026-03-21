import { PrismaDealsRepository } from '@/repositories/sales/prisma/prisma-deals-repository';
import { GetDealByIdUseCase } from '@/use-cases/sales/deals/get-deal-by-id';

export function makeGetDealByIdUseCase() {
  const dealsRepository = new PrismaDealsRepository();

  return new GetDealByIdUseCase(dealsRepository);
}
