import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryPriceTablesRepository } from '@/repositories/sales/in-memory/in-memory-price-tables-repository';
import { makePriceTable } from '@/utils/tests/factories/sales/make-price-table';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetPriceTableByIdUseCase } from './get-price-table-by-id';

let priceTablesRepository: InMemoryPriceTablesRepository;
let sut: GetPriceTableByIdUseCase;

describe('Get Price Table By Id', () => {
  beforeEach(() => {
    priceTablesRepository = new InMemoryPriceTablesRepository();
    sut = new GetPriceTableByIdUseCase(priceTablesRepository);
  });

  it('should be able to get a price table by id', async () => {
    const priceTable = makePriceTable({ name: 'Test Table' });
    priceTablesRepository.items.push(priceTable);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: priceTable.id.toString(),
    });

    expect(result.priceTable.name).toBe('Test Table');
  });

  it('should not be able to get a non-existing price table', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: 'non-existing-id',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
