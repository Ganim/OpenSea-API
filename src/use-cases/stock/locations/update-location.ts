import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { LocationType } from '@/entities/stock/value-objects/location-type';
import {
  type LocationDTO,
  locationToDTO,
} from '@/mappers/stock/location/location-to-dto';
import { LocationsRepository } from '@/repositories/stock/locations-repository';

interface UpdateLocationUseCaseRequest {
  id: string;
  code?: string;
  titulo?: string;
  label?: string;
  type?: string;
  parentId?: string;
  capacity?: number;
  currentOccupancy?: number;
  isActive?: boolean;
}

interface UpdateLocationUseCaseResponse {
  location: LocationDTO;
}

export class UpdateLocationUseCase {
  constructor(private locationsRepository: LocationsRepository) {}

  async execute(
    request: UpdateLocationUseCaseRequest,
  ): Promise<UpdateLocationUseCaseResponse> {
    const {
      id,
      code,
      titulo,
      label,
      type,
      parentId,
      capacity,
      currentOccupancy,
      isActive,
    } = request;

    // Validate ID
    const location = await this.locationsRepository.findById(
      new UniqueEntityID(id),
    );

    if (!location) {
      throw new ResourceNotFoundError('Location not found');
    }

    // Validate code if provided
    if (code !== undefined) {
      if (!code || code.trim().length === 0) {
        throw new BadRequestError('Code is required');
      }

      if (code.length > 50) {
        throw new BadRequestError('Code must be at most 50 characters long');
      }

      // Check if code is already used by another location
      if (code !== location.code) {
        const existingLocation =
          await this.locationsRepository.findByCode(code);
        if (existingLocation && !existingLocation.id.equals(location.id)) {
          throw new BadRequestError('Location with this code already exists');
        }
      }
    }

    // Validate location type if provided
    let parsedLocationType: LocationType | undefined;
    if (type !== undefined) {
      const validTypes = [
        'WAREHOUSE',
        'ZONE',
        'AISLE',
        'SHELF',
        'BIN',
        'OTHER',
      ];
      if (!validTypes.includes(type)) {
        throw new BadRequestError(
          'Invalid location type. Must be one of: WAREHOUSE, ZONE, AISLE, SHELF, BIN, OTHER',
        );
      }
      parsedLocationType = LocationType.create(
        type as 'WAREHOUSE' | 'ZONE' | 'AISLE' | 'SHELF' | 'BIN' | 'OTHER',
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
    const finalCapacity = capacity ?? location.capacity;
    const finalOccupancy = currentOccupancy ?? location.currentOccupancy;
    if (finalCapacity !== undefined && finalOccupancy > finalCapacity) {
      throw new BadRequestError('Current occupancy cannot exceed capacity');
    }

    // Validate parent exists if provided
    if (parentId !== undefined) {
      const parentLocation = await this.locationsRepository.findById(
        new UniqueEntityID(parentId),
      );
      if (!parentLocation) {
        throw new BadRequestError('Parent location not found');
      }
    }

    // Update location
    const updatedLocation = await this.locationsRepository.update({
      id: new UniqueEntityID(id),
      code,
      titulo,
      label,
      type: parsedLocationType,
      parentId: parentId ? new UniqueEntityID(parentId) : undefined,
      capacity,
      currentOccupancy,
      isActive,
    });

    if (!updatedLocation) {
      throw new ResourceNotFoundError('Location not found');
    }

    return {
      location: locationToDTO(updatedLocation),
    };
  }
}
