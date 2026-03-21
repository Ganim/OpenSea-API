import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { InMemoryPriceTablesRepository } from '@/repositories/sales/in-memory/in-memory-price-tables-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreatePriceTableUseCase } from './create-price-table';

let priceTablesRepository: InMemoryPriceTablesRepository;
let sut: CreatePriceTableUseCase;

describe('Create Price Table', () => {
  beforeEach(() => {
    priceTablesRepository = new InMemoryPriceTablesRepository();
    sut = new CreatePriceTableUseCase(priceTablesRepository);
  });

  it('should be able to create a price table', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      name: 'Wholesale Prices',
      type: 'WHOLESALE',
      currency: 'BRL',
    });

    expect(result.priceTable).toBeTruthy();
    expect(result.priceTable.name).toBe('Wholesale Prices');
    expect(result.priceTable.type).toBe('WHOLESALE');
    expect(result.priceTable.currency).toBe('BRL');
    expect(result.priceTable.isActive).toBe(true);
    expect(priceTablesRepository.items).toHaveLength(1);
  });

  it('should not be able to create a price table with empty name', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        name: '   ',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not be able to create a price table with duplicate name', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      name: 'Wholesale Prices',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        name: 'Wholesale Prices',
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});
