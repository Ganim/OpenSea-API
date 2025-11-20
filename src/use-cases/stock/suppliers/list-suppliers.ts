import {
  type SupplierDTO,
  supplierToDTO,
} from '@/mappers/stock/supplier/supplier-to-dto';
import type { SuppliersRepository } from '@/repositories/stock/suppliers-repository';

interface ListSuppliersUseCaseResponse {
  suppliers: SupplierDTO[];
}

export class ListSuppliersUseCase {
  constructor(private suppliersRepository: SuppliersRepository) {}

  async execute(): Promise<ListSuppliersUseCaseResponse> {
    const suppliers = await this.suppliersRepository.findMany();

    return {
      suppliers: suppliers.map(supplierToDTO),
    };
  }
}
