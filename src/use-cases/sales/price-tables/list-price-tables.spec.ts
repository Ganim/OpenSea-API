import { InMemoryPriceTablesRepository } from '@/repositories/sales/in-memory/in-memory-price-tables-repository';
import { makePriceTable } from '@/utils/tests/factories/sales/make-price-table';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListPriceTablesUseCase } from './list-price-tables';

let priceTablesRepository: InMemoryPriceTablesRepository;
let sut: ListPriceTablesUseCase;

describe('List Price Tables', () => {
  beforeEach(() => {
    priceTablesRepository = new InMemoryPriceTablesRepository();
    sut = new ListPriceTablesUseCase(priceTablesRepository);
  });

  it('should be able to list price tables', async () => {
    priceTablesRepository.items.push(
      makePriceTable({ name: 'Table 1' }),
      makePriceTable({ name: 'Table 2' }),
    );

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.priceTables).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should be able to filter by type', async () => {
    priceTablesRepository.items.push(
      makePriceTable({ type: 'WHOLESALE' }),
      makePriceTable({ type: 'WHOLESALE' }),
      makePriceTable({ type: 'RETAIL' }),
    );

    const result = await sut.execute({
      tenantId: 'tenant-1',
      type: 'WHOLESALE',
    });

    expect(result.priceTables).toHaveLength(2);
  });

  it('should be able to filter by isActive', async () => {
    priceTablesRepository.items.push(
      makePriceTable({ isActive: true }),
      makePriceTable({ isActive: false }),
    );

    const result = await sut.execute({
      tenantId: 'tenant-1',
      isActive: true,
    });

    expect(result.priceTables).toHaveLength(1);
  });
});
