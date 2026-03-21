import { PrismaCombosRepository } from '@/repositories/sales/prisma/prisma-combos-repository';
import { GetComboByIdUseCase } from '../get-combo-by-id';

export function makeGetComboByIdUseCase() {
  const combosRepository = new PrismaCombosRepository();
  return new GetComboByIdUseCase(combosRepository);
}
