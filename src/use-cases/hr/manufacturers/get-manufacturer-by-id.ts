import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Manufacturer } from '@/entities/hr/organization/manufacturer';
import type { ManufacturersRepository } from '@/repositories/hr/manufacturers-repository';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';

interface GetManufacturerByIdRequest {
  id: string;
}

interface GetManufacturerByIdResponse {
  manufacturer: Manufacturer;
}

export class GetManufacturerByIdUseCase {
  constructor(private manufacturersRepository: ManufacturersRepository) {}

  async execute(
    request: GetManufacturerByIdRequest,
  ): Promise<GetManufacturerByIdResponse> {
    const manufacturer = await this.manufacturersRepository.findById(
      new UniqueEntityID(request.id),
    );

    if (!manufacturer) {
      throw new ResourceNotFoundError('Manufacturer not found');
    }

    return { manufacturer };
  }
}
