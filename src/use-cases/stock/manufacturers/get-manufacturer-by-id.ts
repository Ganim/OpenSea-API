import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ManufacturersRepository } from '@/repositories/stock/manufacturers-repository';

interface GetManufacturerByIdUseCaseRequest {
  tenantId: string;
  id: string;
}

interface GetManufacturerByIdUseCaseResponse {
  manufacturer: import('@/entities/stock/manufacturer').Manufacturer;
}

export class GetManufacturerByIdUseCase {
  constructor(private manufacturersRepository: ManufacturersRepository) {}

  async execute(
    request: GetManufacturerByIdUseCaseRequest,
  ): Promise<GetManufacturerByIdUseCaseResponse> {
    const { tenantId, id } = request;

    const manufacturer = await this.manufacturersRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!manufacturer) {
      throw new ResourceNotFoundError('Manufacturer not found');
    }

    return {
      manufacturer,
    };
  }
}
