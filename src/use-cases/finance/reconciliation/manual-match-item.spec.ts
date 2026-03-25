import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryBankReconciliationsRepository } from '@/repositories/finance/in-memory/in-memory-bank-reconciliations-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ManualMatchItemUseCase } from './manual-match-item';

let reconciliationsRepository: InMemoryBankReconciliationsRepository;
let financeEntriesRepository: InMemoryFinanceEntriesRepository;
let sut: ManualMatchItemUseCase;

describe('ManualMatchItemUseCase', () => {
  beforeEach(() => {
    reconciliationsRepository = new InMemoryBankReconciliationsRepository();
    financeEntriesRepository = new InMemoryFinanceEntriesRepository();
    sut = new ManualMatchItemUseCase(
      reconciliationsRepository,
      financeEntriesRepository,
    );
  });

  it('should manually match an item to a finance entry', async () => {
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

    const entry = await financeEntriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAY-001',
      description: 'Pagamento fornecedor',
      categoryId: 'cat-1',
      expectedAmount: 150.0,
      issueDate: new Date('2026-03-01'),
      dueDate: new Date('2026-03-05'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      reconciliationId: reconciliation.id.toString(),
      itemId: item.id.toString(),
      entryId: entry.id.toString(),
    });

    expect(result.item.matchStatus).toBe('MANUAL_MATCHED');
    expect(result.item.matchedEntryId).toBe(entry.id.toString());
    expect(result.item.matchConfidence).toBe(1.0);
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
        entryId: 'entry-1',
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
        entryId: 'entry-1',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
