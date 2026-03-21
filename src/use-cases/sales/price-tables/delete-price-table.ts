import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PriceTablesRepository } from '@/repositories/sales/price-tables-repository';

interface DeletePriceTableUseCaseRequest {
  tenantId: string;
  id: string;
}

interface DeletePriceTableUseCaseResponse {
  message: string;
}

export class DeletePriceTableUseCase {
  constructor(private priceTablesRepository: PriceTablesRepository) {}

  async execute(
    request: DeletePriceTableUseCaseRequest,
  ): Promise<DeletePriceTableUseCaseResponse> {
    const priceTable = await this.priceTablesRepository.findById(
      new UniqueEntityID(request.id),
      request.tenantId,
    );

    if (!priceTable) {
      throw new ResourceNotFoundError('Price table not found');
    }

    await this.priceTablesRepository.delete(
      new UniqueEntityID(request.id),
      request.tenantId,
    );

    return { message: 'Price table deleted successfully.' };
  }
}
