import {
  type LocationDTO,
  locationToDTO,
} from '@/mappers/stock/location/location-to-dto';
import { LocationsRepository } from '@/repositories/stock/locations-repository';

interface ListLocationsByLocationIdUseCaseInput {
  locationId: string;
}

interface ListLocationsByLocationIdUseCaseResponse {
  locations: LocationDTO[];
}

export class ListLocationsByLocationIdUseCase {
  constructor(private locationsRepository: LocationsRepository) {}

  async execute(
    input: ListLocationsByLocationIdUseCaseInput,
  ): Promise<ListLocationsByLocationIdUseCaseResponse> {
    const { UniqueEntityID } = await import(
      '@/entities/domain/unique-entity-id'
    );
    const parentId = new UniqueEntityID(input.locationId);

    const locations = await this.locationsRepository.findManyByParent(parentId);

    // Add counts to each location
    const locationsWithCounts = await Promise.all(
      locations.map(async (location) => {
        const [subLocationCount, directItemCount, totalItemCount] =
          await Promise.all([
            this.locationsRepository.countSubLocations(location.id),
            this.locationsRepository.countDirectItems(location.id),
            this.locationsRepository.countTotalItems(location.id),
          ]);

        return locationToDTO(location, {
          subLocationCount,
          directItemCount,
          totalItemCount,
        });
      }),
    );

    return {
      locations: locationsWithCounts,
    };
  }
}
