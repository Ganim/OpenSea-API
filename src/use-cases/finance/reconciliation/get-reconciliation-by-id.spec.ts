import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryBankReconciliationsRepository } from '@/repositories/finance/in-memory/in-memory-bank-reconciliations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetReconciliationByIdUseCase } from './get-reconciliation-by-id';

let reconciliationsRepository: InMemoryBankReconciliationsRepository;
let sut: GetReconciliationByIdUseCase;

describe('GetReconciliationByIdUseCase', () => {
  beforeEach(() => {
    reconciliationsRepository = new InMemoryBankReconciliationsRepository();
    sut = new GetReconciliationByIdUseCase(reconciliationsRepository);
  });

  it('should return a reconciliation with items', async () => {
    const reconciliation = await reconciliationsRepository.create({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-1',
      fileName: 'extrato.ofx',
      periodStart: new Date('2026-03-01'),
      periodEnd: new Date('2026-03-15'),
      totalTransactions: 2,
    });

    await reconciliationsRepository.createItems([
      {
        reconciliationId: reconciliation.id.toString(),
        fitId: 'FIT001',
        transactionDate: new Date('2026-03-05'),
        amount: 150.0,
        description: 'PIX ENVIADO',
        type: 'DEBIT',
      },
    ]);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      reconciliationId: reconciliation.id.toString(),
    });

    expect(result.reconciliation.id).toBe(reconciliation.id.toString());
    expect(result.reconciliation.items).toHaveLength(1);
    expect(result.reconciliation.items![0].fitId).toBe('FIT001');
  });

  it('should throw when reconciliation not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        reconciliationId: 'non-existent',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
