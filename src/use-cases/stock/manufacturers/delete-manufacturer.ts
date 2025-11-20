import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ManufacturersRepository } from '@/repositories/stock/manufacturers-repository';

interface DeleteManufacturerUseCaseRequest {
  id: string;
}

export class DeleteManufacturerUseCase {
  constructor(private manufacturersRepository: ManufacturersRepository) {}

  async execute(request: DeleteManufacturerUseCaseRequest): Promise<void> {
    const { id } = request;

    const manufacturer = await this.manufacturersRepository.findById(
      new UniqueEntityID(id),
    );

    if (!manufacturer) {
      throw new ResourceNotFoundError('Manufacturer not found');
    }

    await this.manufacturersRepository.delete(new UniqueEntityID(id));
  }
}
