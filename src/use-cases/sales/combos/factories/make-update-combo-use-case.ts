import { PrismaCombosRepository } from '@/repositories/sales/prisma/prisma-combos-repository';
import { UpdateComboUseCase } from '../update-combo';

export function makeUpdateComboUseCase() {
  const combosRepository = new PrismaCombosRepository();
  return new UpdateComboUseCase(combosRepository);
}
