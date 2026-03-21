import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryPriceTablesRepository } from '@/repositories/sales/in-memory/in-memory-price-tables-repository';
import { makePriceTable } from '@/utils/tests/factories/sales/make-price-table';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeletePriceTableUseCase } from './delete-price-table';

let priceTablesRepository: InMemoryPriceTablesRepository;
let sut: DeletePriceTableUseCase;

describe('Delete Price Table', () => {
  beforeEach(() => {
    priceTablesRepository = new InMemoryPriceTablesRepository();
    sut = new DeletePriceTableUseCase(priceTablesRepository);
  });

  it('should be able to soft delete a price table', async () => {
    const priceTable = makePriceTable({ name: 'To Delete' });
    priceTablesRepository.items.push(priceTable);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: priceTable.id.toString(),
    });

    expect(result.message).toBe('Price table deleted successfully.');
    expect(priceTable.deletedAt).toBeTruthy();
  });

  it('should not be able to delete a non-existing price table', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: 'non-existing-id',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
