import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type SupplierDTO,
  supplierToDTO,
} from '@/mappers/stock/supplier/supplier-to-dto';
import type { SuppliersRepository } from '@/repositories/stock/suppliers-repository';

interface GetSupplierByIdUseCaseRequest {
  id: string;
}

interface GetSupplierByIdUseCaseResponse {
  supplier: SupplierDTO;
}

export class GetSupplierByIdUseCase {
  constructor(private suppliersRepository: SuppliersRepository) {}

  async execute({
    id,
  }: GetSupplierByIdUseCaseRequest): Promise<GetSupplierByIdUseCaseResponse> {
    const supplier = await this.suppliersRepository.findById(
      new UniqueEntityID(id),
    );

    if (!supplier) {
      throw new ResourceNotFoundError('Supplier not found');
    }

    return {
      supplier: supplierToDTO(supplier),
    };
  }
}
