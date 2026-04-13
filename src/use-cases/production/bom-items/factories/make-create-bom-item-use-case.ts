import { PrismaBomItemsRepository } from '@/repositories/production/prisma/prisma-bom-items-repository';
import { PrismaBomsRepository } from '@/repositories/production/prisma/prisma-boms-repository';
import { CreateBomItemUseCase } from '../create-bom-item';

export function makeCreateBomItemUseCase() {
  const bomItemsRepository = new PrismaBomItemsRepository();
  const bomsRepository = new PrismaBomsRepository();
  return new CreateBomItemUseCase(bomItemsRepository, bomsRepository);
}
