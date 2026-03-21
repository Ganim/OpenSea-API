import { PrismaDealsRepository } from '@/repositories/sales/prisma/prisma-deals-repository';
import { DeleteDealUseCase } from '@/use-cases/sales/deals/delete-deal';

export function makeDeleteDealUseCase() {
  const dealsRepository = new PrismaDealsRepository();

  return new DeleteDealUseCase(dealsRepository);
}
