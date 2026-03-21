import { PrismaCombosRepository } from '@/repositories/sales/prisma/prisma-combos-repository';
import { ListCombosUseCase } from '../list-combos';

export function makeListCombosUseCase() {
  const combosRepository = new PrismaCombosRepository();
  return new ListCombosUseCase(combosRepository);
}
