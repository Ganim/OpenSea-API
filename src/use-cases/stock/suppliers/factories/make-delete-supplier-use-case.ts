import { PrismaSuppliersRepository } from '@/repositories/stock/prisma/prisma-suppliers-repository';
import { DeleteSupplierUseCase } from '../delete-supplier';

export function makeDeleteSupplierUseCase() {
  const suppliersRepository = new PrismaSuppliersRepository();
  const deleteSupplierUseCase = new DeleteSupplierUseCase(suppliersRepository);
  return deleteSupplierUseCase;
}
