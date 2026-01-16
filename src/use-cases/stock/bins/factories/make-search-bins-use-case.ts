import { PrismaBinsRepository } from '@/repositories/stock/prisma/prisma-bins-repository';
import { SearchBinsUseCase } from '../search-bins';

export function makeSearchBinsUseCase() {
  const binsRepository = new PrismaBinsRepository();
  return new SearchBinsUseCase(binsRepository);
}
