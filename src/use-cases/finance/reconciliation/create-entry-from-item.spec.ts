import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryBankReconciliationsRepository } from '@/repositories/finance/in-memory/in-memory-bank-reconciliations-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateEntryFromItemUseCase } from './create-entry-from-item';

let reconciliationsRepository: InMemoryBankReconciliationsRepository;
let financeEntriesRepository: InMemoryFinanceEntriesRepository;
let sut: CreateEntryFromItemUseCase;

describe('CreateEntryFromItemUseCase', () => {
  beforeEach(() => {
    reconciliationsRepository = new InMemoryBankReconciliationsRepository();
    financeEntriesRepository = new InMemoryFinanceEntriesRepository();
    sut = new CreateEntryFromItemUseCase(
      reconciliationsRepository,
      financeEntriesRepository,
    );
  });

  it('should create a PAYABLE entry from a DEBIT transaction', async () => {
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
        amount: 200.0,
        description: 'PIX ENVIADO - FORNECEDOR',
        type: 'DEBIT',
      },
    ]);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      reconciliationId: reconciliation.id.toString(),
      itemId: item.id.toString(),
      categoryId: 'cat-1',
      createdBy: 'user-1',
    });

    expect(result.item.matchStatus).toBe('CREATED');
    expect(result.entryId).toBeDefined();

    // Verify created finance entry
    const createdEntry = financeEntriesRepository.items.find(
      (e) => e.id.toString() === result.entryId,
    );
    expect(createdEntry).toBeDefined();
    expect(createdEntry!.type).toBe('PAYABLE');
    expect(createdEntry!.expectedAmount).toBe(200.0);
  });

  it('should create a RECEIVABLE entry from a CREDIT transaction', async () => {
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
        fitId: 'FIT002',
        transactionDate: new Date('2026-03-10'),
        amount: 500.0,
        description: 'TED RECEBIDO - CLIENTE',
        type: 'CREDIT',
      },
    ]);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      reconciliationId: reconciliation.id.toString(),
      itemId: item.id.toString(),
      categoryId: 'cat-2',
    });

    const createdEntry = financeEntriesRepository.items.find(
      (e) => e.id.toString() === result.entryId,
    );
    expect(createdEntry!.type).toBe('RECEIVABLE');
  });

  it('should reject when item is already matched', async () => {
    const reconciliation = await reconciliationsRepository.create({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-1',
      fileName: 'extrato.ofx',
      periodStart: new Date(),
      periodEnd: new Date(),
      totalTransactions: 1,
    });

    const [item] = await reconciliationsRepository.createItems([
      {
        reconciliationId: reconciliation.id.toString(),
        fitId: 'FIT001',
        transactionDate: new Date(),
        amount: 100,
        description: 'Test',
        type: 'DEBIT',
        matchStatus: 'AUTO_MATCHED',
        matchedEntryId: 'entry-1',
      },
    ]);

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        reconciliationId: reconciliation.id.toString(),
        itemId: item.id.toString(),
        categoryId: 'cat-1',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should reject when reconciliation not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        reconciliationId: 'non-existent',
        itemId: 'item-1',
        categoryId: 'cat-1',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
