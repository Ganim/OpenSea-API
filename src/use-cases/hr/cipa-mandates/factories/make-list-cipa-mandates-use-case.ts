import { PrismaCipaMandatesRepository } from '@/repositories/hr/prisma/prisma-cipa-mandates-repository';
import { ListCipaMandatesUseCase } from '../list-cipa-mandates';

export function makeListCipaMandatesUseCase() {
  const cipaMandatesRepository = new PrismaCipaMandatesRepository();
  return new ListCipaMandatesUseCase(cipaMandatesRepository);
}
