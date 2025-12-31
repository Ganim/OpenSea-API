import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ManufacturersRepository } from '@/repositories/hr/manufacturers-repository';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';

interface DeleteManufacturerRequest {
  id: string;
}

interface DeleteManufacturerResponse {
  success: boolean;
}

export class DeleteManufacturerUseCase {
  constructor(private manufacturersRepository: ManufacturersRepository) {}

  async execute(
    request: DeleteManufacturerRequest,
  ): Promise<DeleteManufacturerResponse> {
    const manufacturer = await this.manufacturersRepository.findById(
      new UniqueEntityID(request.id),
    );

    if (!manufacturer) {
      throw new ResourceNotFoundError('Manufacturer not found');
    }

    await this.manufacturersRepository.delete(new UniqueEntityID(request.id));

    return { success: true };
  }
}
