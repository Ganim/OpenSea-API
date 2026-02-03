import { ManufacturersRepository } from '@/repositories/stock/manufacturers-repository';

interface ListManufacturersUseCaseRequest {
  tenantId: string;
}

interface ListManufacturersUseCaseResponse {
  manufacturers: import('@/entities/stock/manufacturer').Manufacturer[];
}

export class ListManufacturersUseCase {
  constructor(private manufacturersRepository: ManufacturersRepository) {}

  async execute({
    tenantId,
  }: ListManufacturersUseCaseRequest): Promise<ListManufacturersUseCaseResponse> {
    const manufacturers = await this.manufacturersRepository.findMany(tenantId);

    return {
      manufacturers,
    };
  }
}
