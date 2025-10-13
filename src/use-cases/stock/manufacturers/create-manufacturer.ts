import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ManufacturersRepository } from '@/repositories/stock/manufacturers-repository';

interface CreateManufacturerUseCaseRequest {
  name: string;
  country: string;
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
}

interface CreateManufacturerUseCaseResponse {
  manufacturer: {
    id: string;
    name: string;
    country: string;
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
    isActive: boolean;
  };
}

export class CreateManufacturerUseCase {
  constructor(private manufacturersRepository: ManufacturersRepository) {}

  async execute(
    request: CreateManufacturerUseCaseRequest,
  ): Promise<CreateManufacturerUseCaseResponse> {
    const {
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
    } = request;

    // Validate name
    if (!name || name.trim().length === 0) {
      throw new BadRequestError('Name is required');
    }

    if (name.length > 200) {
      throw new BadRequestError('Name must be at most 200 characters long');
    }

    // Validate country
    if (!country || country.trim().length === 0) {
      throw new BadRequestError('Country is required');
    }

    if (country.length > 100) {
      throw new BadRequestError('Country must be at most 100 characters long');
    }

    // Validate email format if provided
    if (email) {
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

    // Check if manufacturer with same name already exists
    const existingManufacturer =
      await this.manufacturersRepository.findByName(name);
    if (existingManufacturer) {
      throw new BadRequestError('Manufacturer with this name already exists');
    }

    // Save to repository
    const createdManufacturer = await this.manufacturersRepository.create({
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
      isActive: true,
    });

    return {
      manufacturer: {
        id: createdManufacturer.id.toString(),
        name: createdManufacturer.name,
        country: createdManufacturer.country,
        email: createdManufacturer.email ?? undefined,
        phone: createdManufacturer.phone ?? undefined,
        website: createdManufacturer.website ?? undefined,
        addressLine1: createdManufacturer.addressLine1 ?? undefined,
        addressLine2: createdManufacturer.addressLine2 ?? undefined,
        city: createdManufacturer.city ?? undefined,
        state: createdManufacturer.state ?? undefined,
        postalCode: createdManufacturer.postalCode ?? undefined,
        rating: createdManufacturer.rating ?? undefined,
        notes: createdManufacturer.notes ?? undefined,
        isActive: createdManufacturer.isActive,
      },
    };
  }
}
