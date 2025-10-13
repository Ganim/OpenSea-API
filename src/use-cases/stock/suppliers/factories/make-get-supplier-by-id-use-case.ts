import { PrismaSuppliersRepository } from '@/repositories/stock/prisma/prisma-suppliers-repository';
import { GetSupplierByIdUseCase } from '../get-supplier-by-id';

export function makeGetSupplierByIdUseCase() {
  const suppliersRepository = new PrismaSuppliersRepository();
  const getSupplierByIdUseCase = new GetSupplierByIdUseCase(
    suppliersRepository,
  );
  return getSupplierByIdUseCase;
}
