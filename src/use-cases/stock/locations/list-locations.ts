import { LocationsRepository } from '@/repositories/stock/locations-repository';

interface LocationDTO {
  id: string;
  code: string;
  description?: string;
  locationType?: string;
  parentId?: string;
  capacity?: number;
  currentOccupancy: number;
  isActive: boolean;
}

interface ListLocationsUseCaseResponse {
  locations: LocationDTO[];
}

export class ListLocationsUseCase {
  constructor(private locationsRepository: LocationsRepository) {}

  async execute(): Promise<ListLocationsUseCaseResponse> {
    const locations = await this.locationsRepository.findManyActive();

    return {
      locations: locations.map((location) => ({
        id: location.id.toString(),
        code: location.code,
        description: location.description,
        locationType: location.locationType?.value,
        parentId: location.parentId?.toString(),
        capacity: location.capacity,
        currentOccupancy: location.currentOccupancy,
        isActive: location.isActive,
      })),
    };
  }
}
