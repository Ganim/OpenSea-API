import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryBankReconciliationsRepository } from '@/repositories/finance/in-memory/in-memory-bank-reconciliations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { IgnoreReconciliationItemUseCase } from './ignore-reconciliation-item';

let reconciliationsRepository: InMemoryBankReconciliationsRepository;
let sut: IgnoreReconciliationItemUseCase;

describe('IgnoreReconciliationItemUseCase', () => {
  beforeEach(() => {
    reconciliationsRepository = new InMemoryBankReconciliationsRepository();
    sut = new IgnoreReconciliationItemUseCase(reconciliationsRepository);
  });

  it('should mark an item as ignored', async () => {
    const reconciliation = await reconciliationsRepository.create({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-1',
      fileName: 'extrato.ofx',
      periodStart: new Date('2026-03-01'),
      periodEnd: new Date('2026-03-15'),
      totalTransactions: 1,
    });

    const [item] = await reconciliationsRepository.createItems([
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
      itemId: item.id.toString(),
    });

    expect(result.item.matchStatus).toBe('IGNORED');
  });

  it('should reject when reconciliation is completed', async () => {
    const reconciliation = await reconciliationsRepository.create({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-1',
      fileName: 'extrato.ofx',
      periodStart: new Date(),
      periodEnd: new Date(),
      totalTransactions: 1,
      status: 'COMPLETED',
    });

    const [item] = await reconciliationsRepository.createItems([
      {
        reconciliationId: reconciliation.id.toString(),
        fitId: 'FIT001',
        transactionDate: new Date(),
        amount: 100,
        description: 'Test',
        type: 'DEBIT',
      },
    ]);

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        reconciliationId: reconciliation.id.toString(),
        itemId: item.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should reject when item not found', async () => {
    const reconciliation = await reconciliationsRepository.create({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-1',
      fileName: 'extrato.ofx',
      periodStart: new Date(),
      periodEnd: new Date(),
      totalTransactions: 0,
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        reconciliationId: reconciliation.id.toString(),
        itemId: 'non-existent',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
