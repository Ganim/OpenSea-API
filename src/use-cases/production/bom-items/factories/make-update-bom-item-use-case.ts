import { PrismaBomItemsRepository } from '@/repositories/production/prisma/prisma-bom-items-repository';
import { UpdateBomItemUseCase } from '../update-bom-item';

export function makeUpdateBomItemUseCase() {
  const bomItemsRepository = new PrismaBomItemsRepository();
  return new UpdateBomItemUseCase(bomItemsRepository);
}
