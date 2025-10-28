import {
  type ManufacturerDTO,
  manufacturerToDTO,
} from '@/mappers/stock/manufacturer/manufacturer-to-dto';
import { ManufacturersRepository } from '@/repositories/stock/manufacturers-repository';

interface ListManufacturersUseCaseResponse {
  manufacturers: ManufacturerDTO[];
}

export class ListManufacturersUseCase {
  constructor(private manufacturersRepository: ManufacturersRepository) {}

  async execute(): Promise<ListManufacturersUseCaseResponse> {
    const manufacturers = await this.manufacturersRepository.findMany();

    return {
      manufacturers: manufacturers.map(manufacturerToDTO),
    };
  }
}
