// TODO: Replace with Prisma repositories when PrismaDealsRepository is created
import { InMemoryDealsRepository } from '@/repositories/sales/in-memory/in-memory-deals-repository';
import { GetDealByIdUseCase } from '@/use-cases/sales/deals/get-deal-by-id';

export function makeGetDealByIdUseCase() {
  const dealsRepository = new InMemoryDealsRepository();

  return new GetDealByIdUseCase(dealsRepository);
}
