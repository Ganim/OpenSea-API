import { LocationsRepository } from '@/repositories/stock/locations-repository';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

interface DeleteLocationUseCaseRequest {
  id: string;
}

export class DeleteLocationUseCase {
  constructor(private locationsRepository: LocationsRepository) {}

  async execute(request: DeleteLocationUseCaseRequest): Promise<void> {
    const { id } = request;

    const location = await this.locationsRepository.findById(
      new UniqueEntityID(id),
    );

    if (!location) {
      throw new ResourceNotFoundError('Location not found');
    }

    await this.locationsRepository.delete(new UniqueEntityID(id));
  }
}
