import { PrismaSuppliersRepository } from '@/repositories/stock/prisma/prisma-suppliers-repository';
import { UpdateSupplierUseCase } from '../update-supplier';

export function makeUpdateSupplierUseCase() {
  const suppliersRepository = new PrismaSuppliersRepository();
  const updateSupplierUseCase = new UpdateSupplierUseCase(suppliersRepository);
  return updateSupplierUseCase;
}
