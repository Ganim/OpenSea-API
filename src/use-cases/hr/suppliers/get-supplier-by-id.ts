import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Supplier } from '@/entities/hr/organization/supplier';
import type { SuppliersRepository } from '@/repositories/hr/suppliers-repository';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';

interface GetSupplierByIdRequest {
  id: string;
}

interface GetSupplierByIdResponse {
  supplier: Supplier;
}

export class GetSupplierByIdUseCase {
  constructor(private suppliersRepository: SuppliersRepository) {}

  async execute(
    request: GetSupplierByIdRequest,
  ): Promise<GetSupplierByIdResponse> {
    const supplier = await this.suppliersRepository.findById(
      new UniqueEntityID(request.id),
    );

    if (!supplier) {
      throw new ResourceNotFoundError('Supplier not found');
    }

    return { supplier };
  }
}
