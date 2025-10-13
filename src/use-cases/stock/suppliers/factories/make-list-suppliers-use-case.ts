import { PrismaSuppliersRepository } from '@/repositories/stock/prisma/prisma-suppliers-repository';
import { ListSuppliersUseCase } from '../list-suppliers';

export function makeListSuppliersUseCase() {
  const suppliersRepository = new PrismaSuppliersRepository();
  const listSuppliersUseCase = new ListSuppliersUseCase(suppliersRepository);
  return listSuppliersUseCase;
}
