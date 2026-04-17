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

  // P3-40: serial Promise.all execution must produce strictly sequential
  // codes (LC-000001, LC-000002, ...). This is the happy path — each
  // create awaits its predecessor so the count-based generator sees the
  // updated state before the next call.
  it('should generate strictly sequential codes when calls are serialized', async () => {
    const codes: string[] = [];
    for (let i = 0; i < 5; i++) {
      const result = await sut.execute({
        tenantId: 'tenant-1',
        date: new Date('2026-04-01'),
        description: `Lançamento ${i}`,
        sourceType: 'MANUAL',
        lines: [
          { chartOfAccountId: 'account-1', type: 'DEBIT', amount: 100 },
          { chartOfAccountId: 'account-2', type: 'CREDIT', amount: 100 },
        ],
      });
      codes.push(result.journalEntry.code!);
    }

    expect(codes).toEqual([
      'LC-000001',
      'LC-000002',
      'LC-000003',
      'LC-000004',
      'LC-000005',
    ]);

    // No two journal entries share the same code.
    expect(new Set(codes).size).toBe(codes.length);
  });

  // P3-40: documents the known race in the in-memory generator. When two
  // generateNextCode() calls resolve before either commit reaches the
  // repository, both observe the same count and return the same code.
  // The Prisma counterpart relies on a unique index + retry to protect
  // production. This test pins the in-memory limitation so anyone touching
  // generateNextCode notices the divergence.
  it('demonstrates that in-memory generateNextCode is not concurrency-safe (regression baseline)', async () => {
    const repo = new InMemoryJournalEntriesRepository();

    const [code1, code2] = await Promise.all([
      repo.generateNextCode('tenant-1'),
      repo.generateNextCode('tenant-1'),
    ]);

    // Both calls observed an empty repository → both return LC-000001.
    // Production (Prisma) holds a unique index that surfaces the conflict
    // on insert; the in-memory repo has no such guard. If this assertion
    // ever flips it means someone added concurrency protection — update
    // the Prisma side too.
    expect(code1).toBe('LC-000001');
    expect(code2).toBe('LC-000001');
  });

  it('should resume sequential numbering across separate use-case calls in same tenant', async () => {
    const tenantId = 'tenant-resume';

    for (let i = 0; i < 3; i++) {
      await sut.execute({
        tenantId,
        date: new Date('2026-04-01'),
        description: `Initial ${i}`,
        sourceType: 'MANUAL',
        lines: [
          { chartOfAccountId: 'account-1', type: 'DEBIT', amount: 10 },
          { chartOfAccountId: 'account-2', type: 'CREDIT', amount: 10 },
        ],
      });
    }

    // Next code from a fresh generateNextCode call — must continue numbering.
    const next = await repository.generateNextCode(tenantId);
    expect(next).toBe('LC-000004');
  });

  it('should isolate code sequence per tenant', async () => {
    const tenantA = 'tenant-A';
    const tenantB = 'tenant-B';

    const a1 = await sut.execute({
      tenantId: tenantA,
      date: new Date('2026-04-01'),
      description: 'A1',
      sourceType: 'MANUAL',
      lines: [
        { chartOfAccountId: 'account-1', type: 'DEBIT', amount: 100 },
        { chartOfAccountId: 'account-2', type: 'CREDIT', amount: 100 },
      ],
    });

    const b1 = await sut.execute({
      tenantId: tenantB,
      date: new Date('2026-04-01'),
      description: 'B1',
      sourceType: 'MANUAL',
      lines: [
        { chartOfAccountId: 'account-1', type: 'DEBIT', amount: 200 },
        { chartOfAccountId: 'account-2', type: 'CREDIT', amount: 200 },
      ],
    });

    // Both tenants start from LC-000001 — sequence is per-tenant.
    expect(a1.journalEntry.code).toBe('LC-000001');
    expect(b1.journalEntry.code).toBe('LC-000001');
  });
});
