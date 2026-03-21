// TODO: Replace with Prisma repositories when PrismaDealsRepository is created
import { InMemoryDealsRepository } from '@/repositories/sales/in-memory/in-memory-deals-repository';
import { UpdateDealUseCase } from '@/use-cases/sales/deals/update-deal';

export function makeUpdateDealUseCase() {
  const dealsRepository = new InMemoryDealsRepository();

  return new UpdateDealUseCase(dealsRepository);
}
