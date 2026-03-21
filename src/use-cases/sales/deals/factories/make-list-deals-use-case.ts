// TODO: Replace with Prisma repositories when PrismaDealsRepository is created
import { InMemoryDealsRepository } from '@/repositories/sales/in-memory/in-memory-deals-repository';
import { ListDealsUseCase } from '@/use-cases/sales/deals/list-deals';

export function makeListDealsUseCase() {
  const dealsRepository = new InMemoryDealsRepository();

  return new ListDealsUseCase(dealsRepository);
}
