import { PrismaCombosRepository } from '@/repositories/sales/prisma/prisma-combos-repository';
import { DeleteComboUseCase } from '../delete-combo';

export function makeDeleteComboUseCase() {
  const combosRepository = new PrismaCombosRepository();
  return new DeleteComboUseCase(combosRepository);
}
