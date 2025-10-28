import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type LocationDTO,
  locationToDTO,
} from '@/mappers/stock/location/location-to-dto';
import { LocationsRepository } from '@/repositories/stock/locations-repository';

interface GetLocationByIdUseCaseRequest {
  id: string;
}

interface GetLocationByIdUseCaseResponse {
  location: LocationDTO;
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
      location: locationToDTO(location),
    };
  }
}
