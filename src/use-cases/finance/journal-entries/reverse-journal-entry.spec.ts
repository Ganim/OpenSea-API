import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryJournalEntriesRepository } from '@/repositories/finance/in-memory/in-memory-journal-entries-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateJournalEntryUseCase } from './create-journal-entry';
import { ReverseJournalEntryUseCase } from './reverse-journal-entry';

vi.mock('@/workers/queues/audit.queue', () => ({
  queueAuditLog: vi.fn().mockResolvedValue(undefined),
}));

let repository: InMemoryJournalEntriesRepository;
let createSut: CreateJournalEntryUseCase;
let reverseSut: ReverseJournalEntryUseCase;

describe('ReverseJournalEntryUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryJournalEntriesRepository();
    createSut = new CreateJournalEntryUseCase(repository);
    reverseSut = new ReverseJournalEntryUseCase(repository);
  });

  it('should reverse a posted journal entry', async () => {
    const { journalEntry: original } = await createSut.execute({
      tenantId: 'tenant-1',
      date: new Date('2026-04-01'),
      description: 'Pagamento original',
      sourceType: 'MANUAL',
      lines: [
        { chartOfAccountId: 'account-1', type: 'DEBIT', amount: 100 },
        { chartOfAccountId: 'account-2', type: 'CREDIT', amount: 100 },
      ],
    });

    const result = await reverseSut.execute({
      tenantId: 'tenant-1',
      journalEntryId: original.id,
    });

    expect(result.reversalEntry).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        description: `Estorno: ${original.description}`,
        status: 'POSTED',
        tenantId: 'tenant-1',
      }),
    );
  });

  it('should swap DEBIT and CREDIT lines in the reversal', async () => {
    const { journalEntry: original } = await createSut.execute({
      tenantId: 'tenant-1',
      date: new Date('2026-04-01'),
      description: 'Lançamento',
      sourceType: 'MANUAL',
      lines: [
        { chartOfAccountId: 'account-1', type: 'DEBIT', amount: 100 },
        { chartOfAccountId: 'account-2', type: 'CREDIT', amount: 100 },
      ],
    });

    const { reversalEntry } = await reverseSut.execute({
      tenantId: 'tenant-1',
      journalEntryId: original.id,
    });

    const debitLine = reversalEntry.lines.find(
      (l) => l.chartOfAccountId === 'account-1',
    );
    const creditLine = reversalEntry.lines.find(
      (l) => l.chartOfAccountId === 'account-2',
    );

    expect(debitLine?.type).toBe('CREDIT');
    expect(creditLine?.type).toBe('DEBIT');
  });

  it('should mark original entry as REVERSED', async () => {
    const { journalEntry: original } = await createSut.execute({
      tenantId: 'tenant-1',
      date: new Date('2026-04-01'),
      description: 'Lançamento',
      sourceType: 'MANUAL',
      lines: [
        { chartOfAccountId: 'account-1', type: 'DEBIT', amount: 100 },
        { chartOfAccountId: 'account-2', type: 'CREDIT', amount: 100 },
      ],
    });

    await reverseSut.execute({
      tenantId: 'tenant-1',
      journalEntryId: original.id,
    });

    const updated = repository.items.find((i) => i.id === original.id);
    expect(updated?.status).toBe('REVERSED');
  });

  it('should throw BadRequestError when trying to reverse an already-reversed entry', async () => {
    const { journalEntry: original } = await createSut.execute({
      tenantId: 'tenant-1',
      date: new Date('2026-04-01'),
      description: 'Lançamento',
      sourceType: 'MANUAL',
      lines: [
        { chartOfAccountId: 'account-1', type: 'DEBIT', amount: 100 },
        { chartOfAccountId: 'account-2', type: 'CREDIT', amount: 100 },
      ],
    });

    await reverseSut.execute({
      tenantId: 'tenant-1',
      journalEntryId: original.id,
    });

    await expect(
      reverseSut.execute({
        tenantId: 'tenant-1',
        journalEntryId: original.id,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw ResourceNotFoundError when entry does not exist', async () => {
    await expect(
      reverseSut.execute({
        tenantId: 'tenant-1',
        journalEntryId: 'non-existent-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not find entry from a different tenant', async () => {
    const { journalEntry: original } = await createSut.execute({
      tenantId: 'tenant-1',
      date: new Date('2026-04-01'),
      description: 'Lançamento',
      sourceType: 'MANUAL',
      lines: [
        { chartOfAccountId: 'account-1', type: 'DEBIT', amount: 100 },
        { chartOfAccountId: 'account-2', type: 'CREDIT', amount: 100 },
      ],
    });

    await expect(
      reverseSut.execute({
        tenantId: 'tenant-2',
        journalEntryId: original.id,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
