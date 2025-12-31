import { PrismaSuppliersRepository } from '@/repositories/hr/prisma/prisma-suppliers-repository';
import { CreateSupplierUseCase } from '../create-supplier';
import { GetSupplierByIdUseCase } from '../get-supplier-by-id';
import { ListSuppliersUseCase } from '../list-suppliers';
import { UpdateSupplierUseCase } from '../update-supplier';
import { DeleteSupplierUseCase } from '../delete-supplier';

export function makeCreateSupplierUseCase() {
  const suppliersRepository = new PrismaSuppliersRepository();
  return new CreateSupplierUseCase(suppliersRepository);
}

export function makeGetSupplierByIdUseCase() {
  const suppliersRepository = new PrismaSuppliersRepository();
  return new GetSupplierByIdUseCase(suppliersRepository);
}

export function makeListSuppliersUseCase() {
  const suppliersRepository = new PrismaSuppliersRepository();
  return new ListSuppliersUseCase(suppliersRepository);
}

export function makeUpdateSupplierUseCase() {
  const suppliersRepository = new PrismaSuppliersRepository();
  return new UpdateSupplierUseCase(suppliersRepository);
}

export function makeDeleteSupplierUseCase() {
  const suppliersRepository = new PrismaSuppliersRepository();
  return new DeleteSupplierUseCase(suppliersRepository);
}
