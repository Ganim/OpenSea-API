import { PrismaBinsRepository } from '@/repositories/stock/prisma/prisma-bins-repository';
import { ListBinsUseCase } from '../list-bins';

export function makeListBinsUseCase() {
  const binsRepository = new PrismaBinsRepository();
  return new ListBinsUseCase(binsRepository);
}
