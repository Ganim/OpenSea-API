import { ManufacturersRepository } from '@/repositories/stock/manufacturers-repository';

interface ManufacturerDTO {
  id: string;
  name: string;
  country: string;
  email?: string;
  phone?: string;
  website?: string;
  isActive: boolean;
}

interface ListManufacturersUseCaseResponse {
  manufacturers: ManufacturerDTO[];
}

export class ListManufacturersUseCase {
  constructor(private manufacturersRepository: ManufacturersRepository) {}

  async execute(): Promise<ListManufacturersUseCaseResponse> {
    const manufacturers = await this.manufacturersRepository.findMany();

    return {
      manufacturers: manufacturers.map((manufacturer) => ({
        id: manufacturer.id.toString(),
        name: manufacturer.name,
        country: manufacturer.country,
        email: manufacturer.email ?? undefined,
        phone: manufacturer.phone ?? undefined,
        website: manufacturer.website ?? undefined,
        isActive: manufacturer.isActive,
      })),
    };
  }
}
