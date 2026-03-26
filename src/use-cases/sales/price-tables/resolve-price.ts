import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { CustomerPricesRepository } from '@/repositories/sales/customer-prices-repository';
import type { PriceTableItemsRepository } from '@/repositories/sales/price-table-items-repository';
import type { PriceTablesRepository } from '@/repositories/sales/price-tables-repository';

interface ResolvePriceUseCaseRequest {
  tenantId: string;
  variantId: string;
  customerId?: string;
  quantity?: number;
  priceTableId?: string;
}

interface ResolvePriceUseCaseResponse {
  variantId: string;
  price: number;
  source: 'customer_price' | 'price_table' | 'default';
  priceTableId: string | null;
  priceTableName: string | null;
  tiered: boolean;
}

export class ResolvePriceUseCase {
  constructor(
    private priceTablesRepository: PriceTablesRepository,
    private priceTableItemsRepository: PriceTableItemsRepository,
    private customerPricesRepository: CustomerPricesRepository,
  ) {}

  async execute(
    request: ResolvePriceUseCaseRequest,
  ): Promise<ResolvePriceUseCaseResponse> {
    const { tenantId, variantId, customerId, quantity, priceTableId } = request;

    // 1. Check customer-specific price first (highest priority)
    if (customerId) {
      const customerPrice =
        await this.customerPricesRepository.findByCustomerAndVariant(
          customerId,
          variantId,
          tenantId,
        );

      if (customerPrice) {
        return {
          variantId,
          price: customerPrice.price,
          source: 'customer_price',
          priceTableId: null,
          priceTableName: null,
          tiered: false,
        };
      }
    }

    // 2. Check price tables
    const tablesWithRules =
      await this.priceTablesRepository.findActiveWithRulesByTenant(tenantId);

    const candidateTables = priceTableId
      ? tablesWithRules.filter((t) => t.table.id.toString() === priceTableId)
      : tablesWithRules;

    for (const { table } of candidateTables) {
      const bestItem =
        await this.priceTableItemsRepository.findBestForVariantInTable(
          table.id.toString(),
          variantId,
          quantity ?? 1,
        );

      if (bestItem) {
        return {
          variantId,
          price: bestItem.price,
          source: 'price_table',
          priceTableId: table.id.toString(),
          priceTableName: table.name,
          tiered: bestItem.minQuantity > 1,
        };
      }
    }

    // 3. No match found - throw not found for the variant
    throw new ResourceNotFoundError('Variant not found');
  }
}
