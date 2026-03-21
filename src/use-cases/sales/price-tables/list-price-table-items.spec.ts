import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryPriceTableItemsRepository } from '@/repositories/sales/in-memory/in-memory-price-table-items-repository';
import { makePriceTableItem } from '@/utils/tests/factories/sales/make-price-table-item';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListPriceTableItemsUseCase } from './list-price-table-items';

let priceTableItemsRepository: InMemoryPriceTableItemsRepository;
let sut: ListPriceTableItemsUseCase;

describe('List Price Table Items', () => {
  beforeEach(() => {
    priceTableItemsRepository = new InMemoryPriceTableItemsRepository();
    sut = new ListPriceTableItemsUseCase(priceTableItemsRepository);
  });

  it('should be able to list items by price table', async () => {
    const tableId = new UniqueEntityID('table-1');

    priceTableItemsRepository.items.push(
      makePriceTableItem({ priceTableId: tableId, price: 100 }),
      makePriceTableItem({ priceTableId: tableId, price: 200 }),
      makePriceTableItem({ priceTableId: new UniqueEntityID('table-2'), price: 300 }),
    );

    const result = await sut.execute({
      tenantId: 'tenant-1',
      priceTableId: 'table-1',
    });

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
  });
});
