import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PriceTableItem } from '@/entities/sales/price-table-item';
import type { PriceTableItemsRepository } from '@/repositories/sales/price-table-items-repository';
import type { PriceTablesRepository } from '@/repositories/sales/price-tables-repository';

interface UpsertPriceTableItemUseCaseRequest {
  tenantId: string;
  priceTableId: string;
  variantId: string;
  price: number;
  minQuantity?: number;
  maxQuantity?: number;
  costPrice?: number;
  marginPercent?: number;
}

interface UpsertPriceTableItemUseCaseResponse {
  priceTableItem: PriceTableItem;
}

export class UpsertPriceTableItemUseCase {
  constructor(
    private priceTableItemsRepository: PriceTableItemsRepository,
    private priceTablesRepository: PriceTablesRepository,
  ) {}

  async execute(
    request: UpsertPriceTableItemUseCaseRequest,
  ): Promise<UpsertPriceTableItemUseCaseResponse> {
    const priceTable = await this.priceTablesRepository.findById(
      new UniqueEntityID(request.priceTableId),
      request.tenantId,
    );

    if (!priceTable) {
      throw new ResourceNotFoundError('Price table not found');
    }

    const priceTableItem = await this.priceTableItemsRepository.upsert({
      priceTableId: request.priceTableId,
      tenantId: request.tenantId,
      variantId: request.variantId,
      price: request.price,
      minQuantity: request.minQuantity,
      maxQuantity: request.maxQuantity,
      costPrice: request.costPrice,
      marginPercent: request.marginPercent,
    });

    return { priceTableItem };
  }
}
