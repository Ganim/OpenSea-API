import {
  type LocationDTO,
  locationToDTO,
} from '@/mappers/stock/location/location-to-dto';
import { LocationsRepository } from '@/repositories/stock/locations-repository';

interface ListLocationsUseCaseResponse {
  locations: LocationDTO[];
}

export class ListLocationsUseCase {
  constructor(private locationsRepository: LocationsRepository) {}

  async execute(): Promise<ListLocationsUseCaseResponse> {
    const locations = await this.locationsRepository.findManyActive();

    return {
      locations: locations.map(locationToDTO),
    };
  }
}
