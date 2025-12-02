import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ManufacturersRepository } from '@/repositories/stock/manufacturers-repository';

interface UpdateManufacturerUseCaseRequest {
  id: string;
  name?: string;
  country?: string;
  email?: string;
  phone?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  rating?: number;
  notes?: string;
  isActive?: boolean;
}

interface UpdateManufacturerUseCaseResponse {
  manufacturer: import('@/entities/stock/manufacturer').Manufacturer;
}

export class UpdateManufacturerUseCase {
  constructor(private manufacturersRepository: ManufacturersRepository) {}

  async execute(
    request: UpdateManufacturerUseCaseRequest,
  ): Promise<UpdateManufacturerUseCaseResponse> {
    const {
      id,
      name,
      country,
      email,
      phone,
      website,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      rating,
      notes,
      isActive,
    } = request;

    // Validate ID
    const manufacturer = await this.manufacturersRepository.findById(
      new UniqueEntityID(id),
    );

    if (!manufacturer) {
      throw new ResourceNotFoundError('Manufacturer not found');
    }

    // Validate name if provided
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        throw new BadRequestError('Name is required');
      }

      if (name.length > 200) {
        throw new BadRequestError('Name must be at most 200 characters long');
      }

      // Check if name is already used by another manufacturer
      if (name !== manufacturer.name) {
        const existingManufacturer =
          await this.manufacturersRepository.findByName(name);
        if (
          existingManufacturer &&
          !existingManufacturer.id.equals(manufacturer.id)
        ) {
          throw new BadRequestError(
            'Manufacturer with this name already exists',
          );
        }
      }
    }

    // Validate country if provided
    if (country !== undefined) {
      if (!country || country.trim().length === 0) {
        throw new BadRequestError('Country is required');
      }

      if (country.length > 100) {
        throw new BadRequestError(
          'Country must be at most 100 characters long',
        );
      }
    }

    // Validate email format if provided
    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new BadRequestError('Invalid email format');
      }
    }

    // Validate rating if provided
    if (rating !== undefined) {
      if (rating < 0 || rating > 5) {
        throw new BadRequestError('Rating must be between 0 and 5');
      }
    }

    // Update manufacturer
    const updatedManufacturer = await this.manufacturersRepository.update({
      id: new UniqueEntityID(id),
      name,
      country,
      email,
      phone,
      website,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      rating,
      notes,
      isActive,
    });

    if (!updatedManufacturer) {
      throw new ResourceNotFoundError('Manufacturer not found');
    }

    return {
      manufacturer: updatedManufacturer,
    };
  }
}
