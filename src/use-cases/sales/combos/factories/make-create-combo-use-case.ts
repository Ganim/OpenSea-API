import { PrismaCombosRepository } from '@/repositories/sales/prisma/prisma-combos-repository';
import { CreateComboUseCase } from '../create-combo';

export function makeCreateComboUseCase() {
  const combosRepository = new PrismaCombosRepository();
  return new CreateComboUseCase(combosRepository);
}
