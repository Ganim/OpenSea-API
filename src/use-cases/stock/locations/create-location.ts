import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { LocationType } from '@/entities/stock/value-objects/location-type';
import { LocationsRepository } from '@/repositories/stock/locations-repository';

// Função para gerar código aleatório de 5 caracteres
function generateLocationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

interface CreateLocationUseCaseRequest {
  code?: string;
  titulo: string;
  label?: string;
  type: string;
  parentId?: string;
  capacity?: number;
  currentOccupancy?: number;
  isActive?: boolean;
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
      titulo,
      label,
      type,
      parentId,
      capacity,
      currentOccupancy,
      isActive,
    } = request;

    // Generate code if not provided
    const finalCode = code || generateLocationCode();

    // Validate code
    if (finalCode.length > 5) {
      throw new BadRequestError('Code must be at most 5 characters long');
    }

    // Validate titulo
    if (!titulo || titulo.trim().length === 0) {
      throw new BadRequestError('Title is required');
    }

    // Validate type
    if (!type) {
      throw new BadRequestError('Type is required');
    }

    const validTypes = ['WAREHOUSE', 'ZONE', 'AISLE', 'SHELF', 'BIN', 'OTHER'];
    if (!validTypes.includes(type)) {
      throw new BadRequestError(
        'Invalid type. Must be one of: WAREHOUSE, ZONE, AISLE, SHELF, BIN, OTHER',
      );
    }
    const parsedType = LocationType.create(
      type as 'WAREHOUSE' | 'ZONE' | 'AISLE' | 'SHELF' | 'BIN' | 'OTHER',
    );

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
      code: finalCode,
      titulo,
      label,
      type: parsedType,
      parentId: parentId ? new UniqueEntityID(parentId) : undefined,
      capacity,
      currentOccupancy: currentOccupancy ?? 0,
      isActive: isActive ?? true,
    });

    return {
      location: createdLocation,
    };
  }
}
