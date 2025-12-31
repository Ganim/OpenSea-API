import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SuppliersRepository } from '@/repositories/hr/suppliers-repository';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';

interface DeleteSupplierRequest {
  id: string;
}

interface DeleteSupplierResponse {
  success: boolean;
}

export class DeleteSupplierUseCase {
  constructor(private suppliersRepository: SuppliersRepository) {}

  async execute(
    request: DeleteSupplierRequest,
  ): Promise<DeleteSupplierResponse> {
    const supplier = await this.suppliersRepository.findById(
      new UniqueEntityID(request.id),
    );

    if (!supplier) {
      throw new ResourceNotFoundError('Supplier not found');
    }

    await this.suppliersRepository.delete(new UniqueEntityID(request.id));

    return { success: true };
  }
}
