import { InMemoryPriceTableItemsRepository } from '@/repositories/sales/in-memory/in-memory-price-table-items-repository';
import { InMemoryPriceTablesRepository } from '@/repositories/sales/in-memory/in-memory-price-tables-repository';
import { makePriceTable } from '@/utils/tests/factories/sales/make-price-table';
import { beforeEach, describe, expect, it } from 'vitest';
import { BulkImportPricesUseCase } from './bulk-import-prices';

let priceTablesRepository: InMemoryPriceTablesRepository;
let priceTableItemsRepository: InMemoryPriceTableItemsRepository;
let sut: BulkImportPricesUseCase;

describe('Bulk Import Prices', () => {
  beforeEach(() => {
    priceTablesRepository = new InMemoryPriceTablesRepository();
    priceTableItemsRepository = new InMemoryPriceTableItemsRepository();
    sut = new BulkImportPricesUseCase(
      priceTableItemsRepository,
      priceTablesRepository,
    );
  });

  it('should be able to bulk import price items', async () => {
    const priceTable = makePriceTable();
    priceTablesRepository.items.push(priceTable);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      priceTableId: priceTable.id.toString(),
      items: [
        { variantId: 'variant-1', price: 100 },
        { variantId: 'variant-2', price: 200 },
        { variantId: 'variant-3', price: 300 },
      ],
    });

    expect(result.count).toBe(3);
    expect(result.imported).toHaveLength(3);
    expect(priceTableItemsRepository.items).toHaveLength(3);
  });
});
