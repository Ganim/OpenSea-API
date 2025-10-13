import { LocationsRepository } from '@/repositories/stock/locations-repository';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

interface GetLocationByIdUseCaseRequest {
  id: string;
}

interface GetLocationByIdUseCaseResponse {
  location: {
    id: string;
    code: string;
    description?: string;
    locationType?: string;
    parentId?: string;
    capacity?: number;
    currentOccupancy: number;
    isActive: boolean;
  };
}

export class GetLocationByIdUseCase {
  constructor(private locationsRepository: LocationsRepository) {}

  async execute(
    request: GetLocationByIdUseCaseRequest,
  ): Promise<GetLocationByIdUseCaseResponse> {
    const { id } = request;

    const location = await this.locationsRepository.findById(
      new UniqueEntityID(id),
    );

    if (!location) {
      throw new ResourceNotFoundError('Location not found');
    }

    return {
      location: {
        id: location.id.toString(),
        code: location.code,
        description: location.description,
        locationType: location.locationType?.value,
        parentId: location.parentId?.toString(),
        capacity: location.capacity,
        currentOccupancy: location.currentOccupancy,
        isActive: location.isActive,
      },
    };
  }
}
