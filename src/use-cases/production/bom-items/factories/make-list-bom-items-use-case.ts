import { PrismaBomItemsRepository } from '@/repositories/production/prisma/prisma-bom-items-repository';
import { ListBomItemsUseCase } from '../list-bom-items';

export function makeListBomItemsUseCase() {
  const bomItemsRepository = new PrismaBomItemsRepository();
  return new ListBomItemsUseCase(bomItemsRepository);
}
