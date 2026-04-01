import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryJournalEntriesRepository } from '@/repositories/finance/in-memory/in-memory-journal-entries-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateJournalEntryUseCase } from './create-journal-entry';

vi.mock('@/workers/queues/audit.queue', () => ({
  queueAuditLog: vi.fn().mockResolvedValue(undefined),
}));

let repository: InMemoryJournalEntriesRepository;
let sut: CreateJournalEntryUseCase;

describe('CreateJournalEntryUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryJournalEntriesRepository();
    sut = new CreateJournalEntryUseCase(repository);
  });

  it('should create a balanced journal entry', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      date: new Date('2026-04-01'),
      description: 'Pagamento de fornecedor',
      sourceType: 'MANUAL',
      lines: [
        { chartOfAccountId: 'account-1', type: 'DEBIT', amount: 100 },
        { chartOfAccountId: 'account-2', type: 'CREDIT', amount: 100 },
      ],
    });

    expect(result.journalEntry).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        tenantId: 'tenant-1',
        description: 'Pagamento de fornecedor',
        sourceType: 'MANUAL',
        status: 'POSTED',
        code: expect.stringMatching(/^LC-/),
      }),
    );

    expect(result.journalEntry.lines).toHaveLength(2);
  });

  it('should generate sequential codes for same tenant', async () => {
    const first = await sut.execute({
      tenantId: 'tenant-1',
      date: new Date('2026-04-01'),
      description: 'Lançamento 1',
      sourceType: 'MANUAL',
      lines: [
        { chartOfAccountId: 'account-1', type: 'DEBIT', amount: 50 },
        { chartOfAccountId: 'account-2', type: 'CREDIT', amount: 50 },
      ],
    });

    const second = await sut.execute({
      tenantId: 'tenant-1',
      date: new Date('2026-04-01'),
      description: 'Lançamento 2',
      sourceType: 'MANUAL',
      lines: [
        { chartOfAccountId: 'account-1', type: 'DEBIT', amount: 200 },
        { chartOfAccountId: 'account-2', type: 'CREDIT', amount: 200 },
      ],
    });

    expect(first.journalEntry.code).toBe('LC-000001');
    expect(second.journalEntry.code).toBe('LC-000002');
  });

  it('should support multiple debit and credit lines', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      date: new Date('2026-04-01'),
      description: 'Lançamento composto',
      sourceType: 'MANUAL',
      lines: [
        { chartOfAccountId: 'account-1', type: 'DEBIT', amount: 60 },
        { chartOfAccountId: 'account-2', type: 'DEBIT', amount: 40 },
        { chartOfAccountId: 'account-3', type: 'CREDIT', amount: 100 },
      ],
    });

    expect(result.journalEntry.lines).toHaveLength(3);
  });

  it('should accept a sourceId when sourceType is not MANUAL', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      date: new Date('2026-04-01'),
      description: 'Lançamento de entrada financeira',
      sourceType: 'FINANCE_ENTRY',
      sourceId: 'entry-123',
      lines: [
        { chartOfAccountId: 'account-1', type: 'DEBIT', amount: 300 },
        { chartOfAccountId: 'account-2', type: 'CREDIT', amount: 300 },
      ],
    });

    expect(result.journalEntry.sourceId).toBe('entry-123');
    expect(result.journalEntry.sourceType).toBe('FINANCE_ENTRY');
  });

  it('should throw BadRequestError when lines count is less than 2', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        date: new Date('2026-04-01'),
        description: 'Apenas uma linha',
        sourceType: 'MANUAL',
        lines: [{ chartOfAccountId: 'account-1', type: 'DEBIT', amount: 100 }],
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError when debits do not equal credits', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        date: new Date('2026-04-01'),
        description: 'Lançamento desbalanceado',
        sourceType: 'MANUAL',
        lines: [
          { chartOfAccountId: 'account-1', type: 'DEBIT', amount: 100 },
          { chartOfAccountId: 'account-2', type: 'CREDIT', amount: 90 },
        ],
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should allow small rounding differences within 0.01 tolerance', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      date: new Date('2026-04-01'),
      description: 'Arredondamento',
      sourceType: 'MANUAL',
      lines: [
        { chartOfAccountId: 'account-1', type: 'DEBIT', amount: 100.005 },
        { chartOfAccountId: 'account-2', type: 'CREDIT', amount: 100 },
      ],
    });

    expect(result.journalEntry).toBeDefined();
  });
});
