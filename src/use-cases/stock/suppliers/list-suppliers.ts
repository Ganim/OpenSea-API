import {
  type SupplierDTO,
  supplierToDTO,
} from '@/mappers/stock/supplier/supplier-to-dto';
import type { SuppliersRepository } from '@/repositories/stock/suppliers-repository';

interface ListSuppliersUseCaseRequest {
  tenantId: string;
}

interface ListSuppliersUseCaseResponse {
  suppliers: SupplierDTO[];
}

export class ListSuppliersUseCase {
  constructor(private suppliersRepository: SuppliersRepository) {}

  async execute({
    tenantId,
  }: ListSuppliersUseCaseRequest): Promise<ListSuppliersUseCaseResponse> {
    const suppliers = await this.suppliersRepository.findMany(tenantId);

    return {
      suppliers: suppliers.map(supplierToDTO),
    };
  }
}
