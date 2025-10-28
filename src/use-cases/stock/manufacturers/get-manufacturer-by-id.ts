import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type ManufacturerDTO,
  manufacturerToDTO,
} from '@/mappers/stock/manufacturer/manufacturer-to-dto';
import { ManufacturersRepository } from '@/repositories/stock/manufacturers-repository';

interface GetManufacturerByIdUseCaseRequest {
  id: string;
}

interface GetManufacturerByIdUseCaseResponse {
  manufacturer: ManufacturerDTO;
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
      manufacturer: manufacturerToDTO(manufacturer),
    };
  }
}
