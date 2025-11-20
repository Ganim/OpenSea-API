import { ManufacturersRepository } from '@/repositories/stock/manufacturers-repository';

interface ListManufacturersUseCaseResponse {
  manufacturers: import('@/entities/stock/manufacturer').Manufacturer[];
}

export class ListManufacturersUseCase {
  constructor(private manufacturersRepository: ManufacturersRepository) {}

  async execute(): Promise<ListManufacturersUseCaseResponse> {
    const manufacturers = await this.manufacturersRepository.findMany();

    return {
      manufacturers,
    };
  }
}
