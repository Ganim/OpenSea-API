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

  it('should complete a reconciliation when every item is matched', async () => {
    const reconciliation = await reconciliationsRepository.create({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-1',
      fileName: 'extrato.ofx',
      periodStart: new Date('2026-03-01'),
      periodEnd: new Date('2026-03-15'),
      totalTransactions: 1,
      matchedCount: 1,
      unmatchedCount: 0,
      status: 'IN_PROGRESS',
    });

    await reconciliationsRepository.createItems([
      {
        reconciliationId: reconciliation.id.toString(),
        fitId: 'fit-1',
        transactionDate: new Date('2026-03-05'),
        amount: 150,
        description: 'PIX FORNECEDOR',
        type: 'DEBIT',
        matchedEntryId: 'entry-1',
        matchConfidence: 0.95,
        matchStatus: 'AUTO_MATCHED',
      },
    ]);

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

  it('should reject when there are unmatched items (by unmatchedCount)', async () => {
    const reconciliation = await reconciliationsRepository.create({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-1',
      fileName: 'extrato.ofx',
      periodStart: new Date('2026-03-01'),
      periodEnd: new Date('2026-03-15'),
      totalTransactions: 5,
      matchedCount: 3,
      unmatchedCount: 2,
      status: 'IN_PROGRESS',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        reconciliationId: reconciliation.id.toString(),
      }),
    ).rejects.toThrow(
      /Não é possível finalizar conciliação com itens pendentes/,
    );
  });

  it('should reject when there are items with matchStatus UNMATCHED', async () => {
    const reconciliation = await reconciliationsRepository.create({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-1',
      fileName: 'extrato.ofx',
      periodStart: new Date('2026-03-01'),
      periodEnd: new Date('2026-03-15'),
      totalTransactions: 2,
      matchedCount: 2,
      unmatchedCount: 0,
      status: 'IN_PROGRESS',
    });

    await reconciliationsRepository.createItems([
      {
        reconciliationId: reconciliation.id.toString(),
        fitId: 'fit-1',
        transactionDate: new Date('2026-03-05'),
        amount: 150,
        description: 'PIX MATCHED',
        type: 'DEBIT',
        matchedEntryId: 'entry-1',
        matchConfidence: 0.95,
        matchStatus: 'AUTO_MATCHED',
      },
      {
        reconciliationId: reconciliation.id.toString(),
        fitId: 'fit-2',
        transactionDate: new Date('2026-03-10'),
        amount: 200,
        description: 'PIX PENDING',
        type: 'DEBIT',
        matchStatus: 'UNMATCHED',
      },
    ]);

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        reconciliationId: reconciliation.id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should complete with pending items when force=true is passed', async () => {
    const reconciliation = await reconciliationsRepository.create({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-1',
      fileName: 'extrato.ofx',
      periodStart: new Date('2026-03-01'),
      periodEnd: new Date('2026-03-15'),
      totalTransactions: 3,
      matchedCount: 1,
      unmatchedCount: 2,
      status: 'IN_PROGRESS',
    });

    await reconciliationsRepository.createItems([
      {
        reconciliationId: reconciliation.id.toString(),
        fitId: 'fit-1',
        transactionDate: new Date('2026-03-05'),
        amount: 150,
        description: 'PENDING',
        type: 'DEBIT',
        matchStatus: 'UNMATCHED',
      },
    ]);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      reconciliationId: reconciliation.id.toString(),
      force: true,
    });

    expect(result.reconciliation.status).toBe('COMPLETED');
  });
});
