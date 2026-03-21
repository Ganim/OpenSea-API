import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PriceTable } from '@/entities/sales/price-table';
import type { PriceTablesRepository } from '@/repositories/sales/price-tables-repository';

interface GetPriceTableByIdUseCaseRequest {
  tenantId: string;
  id: string;
}

interface GetPriceTableByIdUseCaseResponse {
  priceTable: PriceTable;
}

export class GetPriceTableByIdUseCase {
  constructor(private priceTablesRepository: PriceTablesRepository) {}

  async execute(
    request: GetPriceTableByIdUseCaseRequest,
  ): Promise<GetPriceTableByIdUseCaseResponse> {
    const priceTable = await this.priceTablesRepository.findById(
      new UniqueEntityID(request.id),
      request.tenantId,
    );

    if (!priceTable) {
      throw new ResourceNotFoundError('Price table not found');
    }

    return { priceTable };
  }
}
