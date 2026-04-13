import { PrismaBomItemsRepository } from '@/repositories/production/prisma/prisma-bom-items-repository';
import { DeleteBomItemUseCase } from '../delete-bom-item';

export function makeDeleteBomItemUseCase() {
  const bomItemsRepository = new PrismaBomItemsRepository();
  return new DeleteBomItemUseCase(bomItemsRepository);
}
