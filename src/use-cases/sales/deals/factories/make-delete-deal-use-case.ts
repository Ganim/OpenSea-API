// TODO: Replace with Prisma repositories when PrismaDealsRepository is created
import { InMemoryDealsRepository } from '@/repositories/sales/in-memory/in-memory-deals-repository';
import { DeleteDealUseCase } from '@/use-cases/sales/deals/delete-deal';

export function makeDeleteDealUseCase() {
  const dealsRepository = new InMemoryDealsRepository();

  return new DeleteDealUseCase(dealsRepository);
}
