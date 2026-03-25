import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryBankReconciliationsRepository } from '@/repositories/finance/in-memory/in-memory-bank-reconciliations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CompleteReconciliationUseCase } from './complete-reconciliation';

let reconciliationsRepository: InMemoryBankReconciliationsRepository;
let sut: CompleteReconciliationUseCase;

describe('CompleteReconciliationUseCase', () => {
  beforeEach(() => {
    reconciliationsRepository = new InMemoryBankReconciliationsRepository();
    sut = new CompleteReconciliationUseCase(reconciliationsRepository);
  });

  it('should complete a reconciliation', async () => {
    const reconciliation = await reconciliationsRepository.create({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-1',
      fileName: 'extrato.ofx',
      periodStart: new Date('2026-03-01'),
      periodEnd: new Date('2026-03-15'),
      totalTransactions: 5,
      status: 'IN_PROGRESS',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      reconciliationId: reconciliation.id.toString(),
    });

    expect(result.reconciliation.status).toBe('COMPLETED');
  });

  it('should reject when reconciliation not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        reconciliationId: 'non-existent',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should reject when already completed', async () => {
    const reconciliation = await reconciliationsRepository.create({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-1',
      fileName: 'extrato.ofx',
      periodStart: new Date(),
      periodEnd: new Date(),
      totalTransactions: 5,
      status: 'COMPLETED',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        reconciliationId: reconciliation.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
