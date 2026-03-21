import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryPriceTableItemsRepository } from '@/repositories/sales/in-memory/in-memory-price-table-items-repository';
import { InMemoryPriceTablesRepository } from '@/repositories/sales/in-memory/in-memory-price-tables-repository';
import { makePriceTable } from '@/utils/tests/factories/sales/make-price-table';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpsertPriceTableItemUseCase } from './upsert-price-table-item';

let priceTablesRepository: InMemoryPriceTablesRepository;
let priceTableItemsRepository: InMemoryPriceTableItemsRepository;
let sut: UpsertPriceTableItemUseCase;

describe('Upsert Price Table Item', () => {
  beforeEach(() => {
    priceTablesRepository = new InMemoryPriceTablesRepository();
    priceTableItemsRepository = new InMemoryPriceTableItemsRepository();
    sut = new UpsertPriceTableItemUseCase(
      priceTableItemsRepository,
      priceTablesRepository,
    );
  });

  it('should be able to create a new price table item', async () => {
    const priceTable = makePriceTable();
    priceTablesRepository.items.push(priceTable);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      priceTableId: priceTable.id.toString(),
      variantId: 'variant-1',
      price: 99.9,
      minQuantity: 1,
    });

    expect(result.priceTableItem).toBeTruthy();
    expect(result.priceTableItem.price).toBe(99.9);
    expect(priceTableItemsRepository.items).toHaveLength(1);
  });

  it('should be able to update an existing price table item', async () => {
    const priceTable = makePriceTable();
    priceTablesRepository.items.push(priceTable);

    await sut.execute({
      tenantId: 'tenant-1',
      priceTableId: priceTable.id.toString(),
      variantId: 'variant-1',
      price: 99.9,
      minQuantity: 1,
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      priceTableId: priceTable.id.toString(),
      variantId: 'variant-1',
      price: 79.9,
      minQuantity: 1,
    });

    expect(result.priceTableItem.price).toBe(79.9);
    expect(priceTableItemsRepository.items).toHaveLength(1);
  });

  it('should not be able to upsert item for non-existing table', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        priceTableId: 'non-existing-id',
        variantId: 'variant-1',
        price: 99.9,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
