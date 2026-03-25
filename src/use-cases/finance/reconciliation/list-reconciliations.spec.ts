import { InMemoryBankReconciliationsRepository } from '@/repositories/finance/in-memory/in-memory-bank-reconciliations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListReconciliationsUseCase } from './list-reconciliations';

let reconciliationsRepository: InMemoryBankReconciliationsRepository;
let sut: ListReconciliationsUseCase;

describe('ListReconciliationsUseCase', () => {
  beforeEach(() => {
    reconciliationsRepository = new InMemoryBankReconciliationsRepository();
    sut = new ListReconciliationsUseCase(reconciliationsRepository);
  });

  it('should list reconciliations for a tenant', async () => {
    await reconciliationsRepository.create({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-1',
      fileName: 'extrato-jan.ofx',
      periodStart: new Date('2026-01-01'),
      periodEnd: new Date('2026-01-31'),
      totalTransactions: 10,
    });

    await reconciliationsRepository.create({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-1',
      fileName: 'extrato-fev.ofx',
      periodStart: new Date('2026-02-01'),
      periodEnd: new Date('2026-02-28'),
      totalTransactions: 15,
    });

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.reconciliations).toHaveLength(2);
    expect(result.meta.total).toBe(2);
  });

  it('should filter by bank account', async () => {
    await reconciliationsRepository.create({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-1',
      fileName: 'a.ofx',
      periodStart: new Date(),
      periodEnd: new Date(),
      totalTransactions: 5,
    });

    await reconciliationsRepository.create({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-2',
      fileName: 'b.ofx',
      periodStart: new Date(),
      periodEnd: new Date(),
      totalTransactions: 3,
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-1',
    });

    expect(result.reconciliations).toHaveLength(1);
    expect(result.reconciliations[0].bankAccountId).toBe('bank-1');
  });

  it('should return empty list for tenant with no reconciliations', async () => {
    const result = await sut.execute({ tenantId: 'tenant-empty' });

    expect(result.reconciliations).toHaveLength(0);
    expect(result.meta.total).toBe(0);
  });

  it('should paginate results', async () => {
    for (let i = 0; i < 5; i++) {
      await reconciliationsRepository.create({
        tenantId: 'tenant-1',
        bankAccountId: 'bank-1',
        fileName: `extrato-${i}.ofx`,
        periodStart: new Date(),
        periodEnd: new Date(),
        totalTransactions: i + 1,
      });
    }

    const result = await sut.execute({
      tenantId: 'tenant-1',
      page: 1,
      limit: 2,
    });

    expect(result.reconciliations).toHaveLength(2);
    expect(result.meta.total).toBe(5);
    expect(result.meta.pages).toBe(3);
  });
});
