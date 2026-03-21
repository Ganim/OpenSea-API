import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PriceTableItem } from '@/entities/sales/price-table-item';
import type { PriceTableItemsRepository } from '@/repositories/sales/price-table-items-repository';
import type { PriceTablesRepository } from '@/repositories/sales/price-tables-repository';

interface BulkImportPriceItem {
  variantId: string;
  price: number;
  minQuantity?: number;
  maxQuantity?: number;
  costPrice?: number;
  marginPercent?: number;
}

interface BulkImportPricesUseCaseRequest {
  tenantId: string;
  priceTableId: string;
  items: BulkImportPriceItem[];
}

interface BulkImportPricesUseCaseResponse {
  imported: PriceTableItem[];
  count: number;
}

export class BulkImportPricesUseCase {
  constructor(
    private priceTableItemsRepository: PriceTableItemsRepository,
    private priceTablesRepository: PriceTablesRepository,
  ) {}

  async execute(
    request: BulkImportPricesUseCaseRequest,
  ): Promise<BulkImportPricesUseCaseResponse> {
    const priceTable = await this.priceTablesRepository.findById(
      new UniqueEntityID(request.priceTableId),
      request.tenantId,
    );

    if (!priceTable) {
      throw new ResourceNotFoundError('Price table not found');
    }

    const itemsToCreate = request.items.map((item) => ({
      priceTableId: request.priceTableId,
      tenantId: request.tenantId,
      variantId: item.variantId,
      price: item.price,
      minQuantity: item.minQuantity,
      maxQuantity: item.maxQuantity,
      costPrice: item.costPrice,
      marginPercent: item.marginPercent,
    }));

    const imported = await this.priceTableItemsRepository.bulkCreate(itemsToCreate);

    return {
      imported,
      count: imported.length,
    };
  }
}
