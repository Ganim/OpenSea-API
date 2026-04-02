import { InMemoryJournalEntriesRepository } from '@/repositories/finance/in-memory/in-memory-journal-entries-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateJournalEntryUseCase } from './create-journal-entry';
import { ListJournalEntriesUseCase } from './list-journal-entries';

vi.mock('@/workers/queues/audit.queue', () => ({
  queueAuditLog: vi.fn().mockResolvedValue(undefined),
}));

let repository: InMemoryJournalEntriesRepository;
let createSut: CreateJournalEntryUseCase;
let listSut: ListJournalEntriesUseCase;

describe('ListJournalEntriesUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryJournalEntriesRepository();
    createSut = new CreateJournalEntryUseCase(repository);
    listSut = new ListJournalEntriesUseCase(repository);
  });

  it('should list journal entries for a tenant', async () => {
    await createSut.execute({
      tenantId: 'tenant-1',
      date: new Date('2026-04-01'),
      description: 'Lançamento 1',
      sourceType: 'MANUAL',
      lines: [
        { chartOfAccountId: 'account-1', type: 'DEBIT', amount: 100 },
        { chartOfAccountId: 'account-2', type: 'CREDIT', amount: 100 },
      ],
    });

    await createSut.execute({
      tenantId: 'tenant-1',
      date: new Date('2026-04-02'),
      description: 'Lançamento 2',
      sourceType: 'MANUAL',
      lines: [
        { chartOfAccountId: 'account-1', type: 'DEBIT', amount: 200 },
        { chartOfAccountId: 'account-2', type: 'CREDIT', amount: 200 },
      ],
    });

    const result = await listSut.execute({ tenantId: 'tenant-1' });

    expect(result.entries).toHaveLength(2);
    expect(result.meta.total).toBe(2);
    expect(result.meta.page).toBe(1);
    expect(result.meta.limit).toBe(20);
    expect(result.meta.pages).toBe(1);
  });

  it('should return empty list when tenant has no entries', async () => {
    const result = await listSut.execute({ tenantId: 'tenant-1' });

    expect(result.entries).toHaveLength(0);
    expect(result.meta.total).toBe(0);
  });

  it('should not list entries from other tenants', async () => {
    await createSut.execute({
      tenantId: 'tenant-2',
      date: new Date('2026-04-01'),
      description: 'Lançamento tenant-2',
      sourceType: 'MANUAL',
      lines: [
        { chartOfAccountId: 'account-1', type: 'DEBIT', amount: 100 },
        { chartOfAccountId: 'account-2', type: 'CREDIT', amount: 100 },
      ],
    });

    const result = await listSut.execute({ tenantId: 'tenant-1' });

    expect(result.entries).toHaveLength(0);
  });

  it('should paginate results', async () => {
    for (let i = 1; i <= 5; i++) {
      await createSut.execute({
        tenantId: 'tenant-1',
        date: new Date('2026-04-01'),
        description: `Lançamento ${i}`,
        sourceType: 'MANUAL',
        lines: [
          { chartOfAccountId: 'account-1', type: 'DEBIT', amount: 100 },
          { chartOfAccountId: 'account-2', type: 'CREDIT', amount: 100 },
        ],
      });
    }

    const result = await listSut.execute({
      tenantId: 'tenant-1',
      page: 2,
      limit: 2,
    });

    expect(result.entries).toHaveLength(2);
    expect(result.meta.total).toBe(5);
    expect(result.meta.page).toBe(2);
    expect(result.meta.limit).toBe(2);
    expect(result.meta.pages).toBe(3);
  });

  it('should filter by chartOfAccountId', async () => {
    await createSut.execute({
      tenantId: 'tenant-1',
      date: new Date('2026-04-01'),
      description: 'Com account-1',
      sourceType: 'MANUAL',
      lines: [
        { chartOfAccountId: 'account-1', type: 'DEBIT', amount: 100 },
        { chartOfAccountId: 'account-2', type: 'CREDIT', amount: 100 },
      ],
    });

    await createSut.execute({
      tenantId: 'tenant-1',
      date: new Date('2026-04-01'),
      description: 'Sem account-1',
      sourceType: 'MANUAL',
      lines: [
        { chartOfAccountId: 'account-3', type: 'DEBIT', amount: 50 },
        { chartOfAccountId: 'account-4', type: 'CREDIT', amount: 50 },
      ],
    });

    const result = await listSut.execute({
      tenantId: 'tenant-1',
      chartOfAccountId: 'account-1',
    });

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].description).toBe('Com account-1');
  });

  it('should filter by sourceType', async () => {
    await createSut.execute({
      tenantId: 'tenant-1',
      date: new Date('2026-04-01'),
      description: 'Manual',
      sourceType: 'MANUAL',
      lines: [
        { chartOfAccountId: 'account-1', type: 'DEBIT', amount: 100 },
        { chartOfAccountId: 'account-2', type: 'CREDIT', amount: 100 },
      ],
    });

    await createSut.execute({
      tenantId: 'tenant-1',
      date: new Date('2026-04-01'),
      description: 'De entrada financeira',
      sourceType: 'FINANCE_ENTRY',
      lines: [
        { chartOfAccountId: 'account-1', type: 'DEBIT', amount: 200 },
        { chartOfAccountId: 'account-2', type: 'CREDIT', amount: 200 },
      ],
    });

    const result = await listSut.execute({
      tenantId: 'tenant-1',
      sourceType: 'FINANCE_ENTRY',
    });

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].sourceType).toBe('FINANCE_ENTRY');
  });

  it('should filter by date range', async () => {
    await createSut.execute({
      tenantId: 'tenant-1',
      date: new Date('2026-03-01'),
      description: 'Março',
      sourceType: 'MANUAL',
      lines: [
        { chartOfAccountId: 'account-1', type: 'DEBIT', amount: 100 },
        { chartOfAccountId: 'account-2', type: 'CREDIT', amount: 100 },
      ],
    });

    await createSut.execute({
      tenantId: 'tenant-1',
      date: new Date('2026-04-01'),
      description: 'Abril',
      sourceType: 'MANUAL',
      lines: [
        { chartOfAccountId: 'account-1', type: 'DEBIT', amount: 200 },
        { chartOfAccountId: 'account-2', type: 'CREDIT', amount: 200 },
      ],
    });

    const result = await listSut.execute({
      tenantId: 'tenant-1',
      dateFrom: new Date('2026-04-01'),
      dateTo: new Date('2026-04-30'),
    });

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].description).toBe('Abril');
  });
});
