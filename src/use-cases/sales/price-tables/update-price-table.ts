import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PriceTable } from '@/entities/sales/price-table';
import type { PriceTablesRepository } from '@/repositories/sales/price-tables-repository';

interface UpdatePriceTableUseCaseRequest {
  tenantId: string;
  id: string;
  name?: string;
  description?: string;
  type?: string;
  currency?: string;
  priceIncludesTax?: boolean;
  isDefault?: boolean;
  priority?: number;
  isActive?: boolean;
  validFrom?: Date;
  validUntil?: Date;
}

interface UpdatePriceTableUseCaseResponse {
  priceTable: PriceTable;
}

export class UpdatePriceTableUseCase {
  constructor(private priceTablesRepository: PriceTablesRepository) {}

  async execute(
    request: UpdatePriceTableUseCaseRequest,
  ): Promise<UpdatePriceTableUseCaseResponse> {
    const priceTable = await this.priceTablesRepository.update({
      id: new UniqueEntityID(request.id),
      tenantId: request.tenantId,
      name: request.name,
      description: request.description,
      type: request.type,
      currency: request.currency,
      priceIncludesTax: request.priceIncludesTax,
      isDefault: request.isDefault,
      priority: request.priority,
      isActive: request.isActive,
      validFrom: request.validFrom,
      validUntil: request.validUntil,
    });

    if (!priceTable) {
      throw new ResourceNotFoundError('Price table not found');
    }

    return { priceTable };
  }
}
