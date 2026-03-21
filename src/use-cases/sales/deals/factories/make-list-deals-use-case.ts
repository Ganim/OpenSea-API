import { PrismaDealsRepository } from '@/repositories/sales/prisma/prisma-deals-repository';
import { ListDealsUseCase } from '@/use-cases/sales/deals/list-deals';

export function makeListDealsUseCase() {
  const dealsRepository = new PrismaDealsRepository();

  return new ListDealsUseCase(dealsRepository);
}
