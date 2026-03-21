import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryPriceTablesRepository } from '@/repositories/sales/in-memory/in-memory-price-tables-repository';
import { makePriceTable } from '@/utils/tests/factories/sales/make-price-table';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdatePriceTableUseCase } from './update-price-table';

let priceTablesRepository: InMemoryPriceTablesRepository;
let sut: UpdatePriceTableUseCase;

describe('Update Price Table', () => {
  beforeEach(() => {
    priceTablesRepository = new InMemoryPriceTablesRepository();
    sut = new UpdatePriceTableUseCase(priceTablesRepository);
  });

  it('should be able to update a price table', async () => {
    const priceTable = makePriceTable({ name: 'Old Name' });
    priceTablesRepository.items.push(priceTable);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: priceTable.id.toString(),
      name: 'New Name',
      priority: 10,
    });

    expect(result.priceTable.name).toBe('New Name');
    expect(result.priceTable.priority).toBe(10);
  });

  it('should not be able to update a non-existing price table', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: 'non-existing-id',
        name: 'Test',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
