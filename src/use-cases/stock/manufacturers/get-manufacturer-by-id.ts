import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ManufacturersRepository } from '@/repositories/stock/manufacturers-repository';

interface GetManufacturerByIdUseCaseRequest {
  id: string;
}

interface GetManufacturerByIdUseCaseResponse {
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
    createdAt: Date;
    updatedAt: Date;
  };
}

export class GetManufacturerByIdUseCase {
  constructor(private manufacturersRepository: ManufacturersRepository) {}

  async execute(
    request: GetManufacturerByIdUseCaseRequest,
  ): Promise<GetManufacturerByIdUseCaseResponse> {
    const { id } = request;

    const manufacturer = await this.manufacturersRepository.findById(
      new UniqueEntityID(id),
    );

    if (!manufacturer) {
      throw new ResourceNotFoundError('Manufacturer not found');
    }

    return {
      manufacturer: {
        id: manufacturer.id.toString(),
        name: manufacturer.name,
        country: manufacturer.country,
        email: manufacturer.email ?? undefined,
        phone: manufacturer.phone ?? undefined,
        website: manufacturer.website ?? undefined,
        addressLine1: manufacturer.addressLine1 ?? undefined,
        addressLine2: manufacturer.addressLine2 ?? undefined,
        city: manufacturer.city ?? undefined,
        state: manufacturer.state ?? undefined,
        postalCode: manufacturer.postalCode ?? undefined,
        rating: manufacturer.rating ?? undefined,
        notes: manufacturer.notes ?? undefined,
        isActive: manufacturer.isActive,
        createdAt: manufacturer.createdAt,
        updatedAt: manufacturer.updatedAt,
      },
    };
  }
}
