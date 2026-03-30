import { InMemoryFinanceEntryRetentionsRepository } from '@/repositories/finance/in-memory/in-memory-finance-entry-retentions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListEntryRetentionsUseCase } from './list-entry-retentions';

let retentionsRepository: InMemoryFinanceEntryRetentionsRepository;
let sut: ListEntryRetentionsUseCase;

describe('ListEntryRetentionsUseCase', () => {
  beforeEach(() => {
    retentionsRepository = new InMemoryFinanceEntryRetentionsRepository();
    sut = new ListEntryRetentionsUseCase(retentionsRepository);
  });

  it('should return empty list when entry has no retentions', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryId: 'entry-1',
    });

    expect(result.retentions).toHaveLength(0);
    expect(result.totalRetained).toBe(0);
  });

  it('should list retentions for a specific entry', async () => {
    await retentionsRepository.createMany([
      {
        tenantId: 'tenant-1',
        entryId: 'entry-1',
        taxType: 'ISS',
        grossAmount: 10000,
        rate: 0.05,
        amount: 500,
        withheld: true,
        description: 'ISS — 5.0%',
      },
      {
        tenantId: 'tenant-1',
        entryId: 'entry-1',
        taxType: 'CSLL',
        grossAmount: 10000,
        rate: 0.09,
        amount: 900,
        withheld: true,
        description: 'CSLL — 9%',
      },
    ]);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryId: 'entry-1',
    });

    expect(result.retentions).toHaveLength(2);
    expect(result.totalRetained).toBe(1400);
  });

  it('should calculate totalRetained as sum of all retention amounts', async () => {
    await retentionsRepository.createMany([
      {
        tenantId: 'tenant-1',
        entryId: 'entry-1',
        taxType: 'ISS',
        grossAmount: 10000,
        rate: 0.05,
        amount: 500,
      },
      {
        tenantId: 'tenant-1',
        entryId: 'entry-1',
        taxType: 'PIS',
        grossAmount: 10000,
        rate: 0.0065,
        amount: 65,
      },
      {
        tenantId: 'tenant-1',
        entryId: 'entry-1',
        taxType: 'COFINS',
        grossAmount: 10000,
        rate: 0.03,
        amount: 300,
      },
    ]);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryId: 'entry-1',
    });

    expect(result.totalRetained).toBe(865);
  });

  it('should round totalRetained to 2 decimal places', async () => {
    await retentionsRepository.createMany([
      {
        tenantId: 'tenant-1',
        entryId: 'entry-1',
        taxType: 'ISS',
        grossAmount: 3333.33,
        rate: 0.05,
        amount: 166.67,
      },
      {
        tenantId: 'tenant-1',
        entryId: 'entry-1',
        taxType: 'CSLL',
        grossAmount: 3333.33,
        rate: 0.09,
        amount: 300.0,
      },
    ]);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryId: 'entry-1',
    });

    // 166.67 + 300.00 = 466.67
    expect(result.totalRetained).toBe(466.67);

    // Ensure no more than 2 decimal digits
    const decimalPart = result.totalRetained.toString().split('.')[1];
    expect(!decimalPart || decimalPart.length <= 2).toBe(true);
  });

  it('should isolate retentions by entryId', async () => {
    await retentionsRepository.createMany([
      {
        tenantId: 'tenant-1',
        entryId: 'entry-1',
        taxType: 'ISS',
        grossAmount: 10000,
        rate: 0.05,
        amount: 500,
      },
      {
        tenantId: 'tenant-1',
        entryId: 'entry-2',
        taxType: 'ISS',
        grossAmount: 5000,
        rate: 0.05,
        amount: 250,
      },
    ]);

    const result1 = await sut.execute({
      tenantId: 'tenant-1',
      entryId: 'entry-1',
    });

    const result2 = await sut.execute({
      tenantId: 'tenant-1',
      entryId: 'entry-2',
    });

    expect(result1.retentions).toHaveLength(1);
    expect(result1.totalRetained).toBe(500);

    expect(result2.retentions).toHaveLength(1);
    expect(result2.totalRetained).toBe(250);
  });

  it('should isolate retentions by tenantId (multi-tenant)', async () => {
    await retentionsRepository.createMany([
      {
        tenantId: 'tenant-1',
        entryId: 'entry-1',
        taxType: 'ISS',
        grossAmount: 10000,
        rate: 0.05,
        amount: 500,
      },
      {
        tenantId: 'tenant-2',
        entryId: 'entry-1',
        taxType: 'ISS',
        grossAmount: 8000,
        rate: 0.05,
        amount: 400,
      },
    ]);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryId: 'entry-1',
    });

    expect(result.retentions).toHaveLength(1);
    expect(result.totalRetained).toBe(500);
  });

  it('should return all six tax types when present', async () => {
    await retentionsRepository.createMany([
      {
        tenantId: 'tenant-1',
        entryId: 'entry-1',
        taxType: 'IRRF',
        grossAmount: 10000,
        rate: 0.1854,
        amount: 1854.0,
      },
      {
        tenantId: 'tenant-1',
        entryId: 'entry-1',
        taxType: 'ISS',
        grossAmount: 10000,
        rate: 0.05,
        amount: 500,
      },
      {
        tenantId: 'tenant-1',
        entryId: 'entry-1',
        taxType: 'INSS',
        grossAmount: 10000,
        rate: 0.0952,
        amount: 951.63,
      },
      {
        tenantId: 'tenant-1',
        entryId: 'entry-1',
        taxType: 'PIS',
        grossAmount: 10000,
        rate: 0.0065,
        amount: 65,
      },
      {
        tenantId: 'tenant-1',
        entryId: 'entry-1',
        taxType: 'COFINS',
        grossAmount: 10000,
        rate: 0.03,
        amount: 300,
      },
      {
        tenantId: 'tenant-1',
        entryId: 'entry-1',
        taxType: 'CSLL',
        grossAmount: 10000,
        rate: 0.09,
        amount: 900,
      },
    ]);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryId: 'entry-1',
    });

    expect(result.retentions).toHaveLength(6);

    const taxTypes = result.retentions.map((r) => r.taxType);
    expect(taxTypes).toContain('IRRF');
    expect(taxTypes).toContain('ISS');
    expect(taxTypes).toContain('INSS');
    expect(taxTypes).toContain('PIS');
    expect(taxTypes).toContain('COFINS');
    expect(taxTypes).toContain('CSLL');

    // 1854 + 500 + 951.63 + 65 + 300 + 900 = 4570.63
    expect(result.totalRetained).toBeCloseTo(4570.63, 2);
  });
});
