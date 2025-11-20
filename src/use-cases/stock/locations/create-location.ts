import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { LocationType } from '@/entities/stock/value-objects/location-type';
import { LocationsRepository } from '@/repositories/stock/locations-repository';

interface CreateLocationUseCaseRequest {
  code: string;
  description?: string;
  locationType?: string;
  parentId?: string;
  capacity?: number;
  currentOccupancy?: number;
}

interface CreateLocationUseCaseResponse {
  location: import('@/entities/stock/location').Location;
}

export class CreateLocationUseCase {
  constructor(private locationsRepository: LocationsRepository) {}

  async execute(
    request: CreateLocationUseCaseRequest,
  ): Promise<CreateLocationUseCaseResponse> {
    const {
      code,
      description,
      locationType,
      parentId,
      capacity,
      currentOccupancy,
    } = request;

    // Validate code
    if (!code || code.trim().length === 0) {
      throw new BadRequestError('Code is required');
    }

    if (code.length > 50) {
      throw new BadRequestError('Code must be at most 50 characters long');
    }

    // Check if code already exists
    const existingLocation = await this.locationsRepository.findByCode(code);
    if (existingLocation) {
      throw new BadRequestError('Location with this code already exists');
    }

    // Validate location type if provided
    let parsedLocationType: LocationType | undefined;
    if (locationType) {
      const validTypes = [
        'WAREHOUSE',
        'ZONE',
        'AISLE',
        'SHELF',
        'BIN',
        'OTHER',
      ];
      if (!validTypes.includes(locationType)) {
        throw new BadRequestError(
          'Invalid location type. Must be one of: WAREHOUSE, ZONE, AISLE, SHELF, BIN, OTHER',
        );
      }
      parsedLocationType = LocationType.create(
        locationType as
          | 'WAREHOUSE'
          | 'ZONE'
          | 'AISLE'
          | 'SHELF'
          | 'BIN'
          | 'OTHER',
      );
    }

    // Validate capacity if provided
    if (capacity !== undefined && capacity < 0) {
      throw new BadRequestError('Capacity cannot be negative');
    }

    // Validate current occupancy if provided
    if (currentOccupancy !== undefined && currentOccupancy < 0) {
      throw new BadRequestError('Current occupancy cannot be negative');
    }

    // Validate that occupancy doesn't exceed capacity
    if (
      capacity !== undefined &&
      currentOccupancy !== undefined &&
      currentOccupancy > capacity
    ) {
      throw new BadRequestError('Current occupancy cannot exceed capacity');
    }

    // Validate parent exists if provided
    if (parentId) {
      const parentLocation = await this.locationsRepository.findById(
        new UniqueEntityID(parentId),
      );
      if (!parentLocation) {
        throw new BadRequestError('Parent location not found');
      }
    }

    // Save to repository
    const createdLocation = await this.locationsRepository.create({
      code,
      description,
      locationType: parsedLocationType,
      parentId: parentId ? new UniqueEntityID(parentId) : undefined,
      capacity,
      currentOccupancy: currentOccupancy ?? 0,
      isActive: true,
    });

    return {
      location: createdLocation,
    };
  }
}
