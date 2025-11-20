import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SuppliersRepository } from '@/repositories/stock/suppliers-repository';

interface DeleteSupplierUseCaseRequest {
  id: string;
}

export class DeleteSupplierUseCase {
  constructor(private suppliersRepository: SuppliersRepository) {}

  async execute({ id }: DeleteSupplierUseCaseRequest): Promise<void> {
    const supplier = await this.suppliersRepository.findById(
      new UniqueEntityID(id),
    );

    if (!supplier) {
      throw new ResourceNotFoundError('Supplier not found');
    }

    await this.suppliersRepository.delete(new UniqueEntityID(id));
  }
}
