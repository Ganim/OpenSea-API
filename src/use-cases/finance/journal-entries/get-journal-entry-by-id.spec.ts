import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryJournalEntriesRepository } from '@/repositories/finance/in-memory/in-memory-journal-entries-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateJournalEntryUseCase } from './create-journal-entry';
import { GetJournalEntryByIdUseCase } from './get-journal-entry-by-id';

vi.mock('@/workers/queues/audit.queue', () => ({
  queueAuditLog: vi.fn().mockResolvedValue(undefined),
}));

let repository: InMemoryJournalEntriesRepository;
let createSut: CreateJournalEntryUseCase;
let getSut: GetJournalEntryByIdUseCase;

describe('GetJournalEntryByIdUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryJournalEntriesRepository();
    createSut = new CreateJournalEntryUseCase(repository);
    getSut = new GetJournalEntryByIdUseCase(repository);
  });

  it('should return a journal entry by id', async () => {
    const { journalEntry: created } = await createSut.execute({
      tenantId: 'tenant-1',
      date: new Date('2026-04-01'),
      description: 'Lançamento de teste',
      sourceType: 'MANUAL',
      lines: [
        { chartOfAccountId: 'account-1', type: 'DEBIT', amount: 150 },
        { chartOfAccountId: 'account-2', type: 'CREDIT', amount: 150 },
      ],
    });

    const result = await getSut.execute({
      tenantId: 'tenant-1',
      id: created.id,
    });

    expect(result.journalEntry).toEqual(
      expect.objectContaining({
        id: created.id,
        tenantId: 'tenant-1',
        description: 'Lançamento de teste',
        status: 'POSTED',
      }),
    );

    expect(result.journalEntry.lines).toHaveLength(2);
  });

  it('should throw ResourceNotFoundError when entry does not exist', async () => {
    await expect(
      getSut.execute({
        tenantId: 'tenant-1',
        id: 'non-existent-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not return entries from other tenants', async () => {
    const { journalEntry: created } = await createSut.execute({
      tenantId: 'tenant-1',
      date: new Date('2026-04-01'),
      description: 'Lançamento tenant-1',
      sourceType: 'MANUAL',
      lines: [
        { chartOfAccountId: 'account-1', type: 'DEBIT', amount: 100 },
        { chartOfAccountId: 'account-2', type: 'CREDIT', amount: 100 },
      ],
    });

    await expect(
      getSut.execute({
        tenantId: 'tenant-2',
        id: created.id,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should return entry with all line details', async () => {
    const { journalEntry: created } = await createSut.execute({
      tenantId: 'tenant-1',
      date: new Date('2026-04-01'),
      description: 'Com descrição nas linhas',
      sourceType: 'MANUAL',
      lines: [
        {
          chartOfAccountId: 'account-1',
          type: 'DEBIT',
          amount: 300,
          description: 'Débito em caixa',
        },
        {
          chartOfAccountId: 'account-2',
          type: 'CREDIT',
          amount: 300,
          description: 'Crédito em receita',
        },
      ],
    });

    const result = await getSut.execute({
      tenantId: 'tenant-1',
      id: created.id,
    });

    const debitLine = result.journalEntry.lines.find(
      (l) => l.chartOfAccountId === 'account-1',
    );
    expect(debitLine?.description).toBe('Débito em caixa');
    expect(debitLine?.amount).toBe(300);
    expect(debitLine?.type).toBe('DEBIT');
  });
});
