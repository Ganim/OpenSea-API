import { LocationType } from '@/entities/stock/value-objects/location-type';
import {
    type LocationDTO,
    locationToDTO,
} from '@/mappers/stock/location/location-to-dto';
import { LocationsRepository } from '@/repositories/stock/locations-repository';

interface ListLocationsUseCaseRequest {
  type?: 'WAREHOUSE' | 'ZONE' | 'AISLE' | 'SHELF' | 'BIN' | 'OTHER';
}

interface ListLocationsUseCaseResponse {
  locations: LocationDTO[];
}

export class ListLocationsUseCase {
  constructor(private locationsRepository: LocationsRepository) {}

  async execute(request?: ListLocationsUseCaseRequest): Promise<ListLocationsUseCaseResponse> {
    const filters = request?.type
      ? { type: LocationType.create(request.type) }
      : undefined;

    const locations = await this.locationsRepository.findManyActive(filters);

    return {
      locations: locations.map(location => locationToDTO(location, undefined)),
    };
  }
}
