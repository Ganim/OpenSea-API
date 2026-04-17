import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryFinanceApprovalRulesRepository } from '@/repositories/finance/in-memory/in-memory-finance-approval-rules-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';

// Mock logger to avoid loading @/@env validation during unit tests
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Mock audit queue
vi.mock('@/workers/queues/audit.queue', () => ({
  queueAuditLog: vi.fn().mockResolvedValue(undefined),
}));

import { EvaluateAutoApprovalUseCase } from './evaluate-auto-approval';

const TENANT_ID = 'test-tenant-id';
const CATEGORY_ID = new UniqueEntityID();
const COST_CENTER_ID = new UniqueEntityID();

function createTestEntry(
  entriesRepo: InMemoryFinanceEntriesRepository,
  overrides: Partial<{
    expectedAmount: number;
    type: 'PAYABLE' | 'RECEIVABLE';
    categoryId: string;
    supplierName: string;
    status: string;
    tags: string[];
  }> = {},
) {
  return entriesRepo.create({
    tenantId: TENANT_ID,
    type: overrides.type ?? 'PAYABLE',
    code: `PAY-${Date.now()}`,
    description: 'Test entry',
    categoryId: overrides.categoryId ?? CATEGORY_ID.toString(),
    costCenterId: COST_CENTER_ID.toString(),
    expectedAmount: overrides.expectedAmount ?? 100,
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 86400000),
    supplierName: overrides.supplierName ?? 'Fornecedor ABC',
    tags: overrides.tags ?? [],
  });
}

describe('EvaluateAutoApprovalUseCase', () => {
  let approvalRulesRepo: InMemoryFinanceApprovalRulesRepository;
  let entriesRepo: InMemoryFinanceEntriesRepository;
  let sut: EvaluateAutoApprovalUseCase;
  let mockRegisterPayment: { execute: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    approvalRulesRepo = new InMemoryFinanceApprovalRulesRepository();
    entriesRepo = new InMemoryFinanceEntriesRepository();
    mockRegisterPayment = {
      execute: vi.fn().mockResolvedValue({
        entry: {},
        payment: {},
      }),
    };
    sut = new EvaluateAutoApprovalUseCase(
      approvalRulesRepo,
      entriesRepo,
      mockRegisterPayment as unknown as import('@/use-cases/finance/entries/register-payment').RegisterPaymentUseCase,
    );
  });

  it('should match rule by maxAmount', async () => {
    await approvalRulesRepo.create({
      tenantId: TENANT_ID,
      name: 'Small payments auto-approve',
      action: 'AUTO_APPROVE',
      maxAmount: 200,
    });

    const entry = await createTestEntry(entriesRepo, { expectedAmount: 150 });

    const result = await sut.execute({
      entryId: entry.id.toString(),
      tenantId: TENANT_ID,
    });

    expect(result.matched).toBe(true);
    expect(result.action).toBe('AUTO_APPROVE');
  });

  it('should match rule by categoryId', async () => {
    const catId = new UniqueEntityID().toString();
    await approvalRulesRepo.create({
      tenantId: TENANT_ID,
      name: 'Category rule',
      action: 'FLAG_REVIEW',
      conditions: { categoryIds: [catId] },
    });

    const entry = await createTestEntry(entriesRepo, { categoryId: catId });

    const result = await sut.execute({
      entryId: entry.id.toString(),
      tenantId: TENANT_ID,
    });

    expect(result.matched).toBe(true);
    expect(result.action).toBe('FLAG_REVIEW');
  });

  it('should match rule by supplierName', async () => {
    await approvalRulesRepo.create({
      tenantId: TENANT_ID,
      name: 'Supplier rule',
      action: 'AUTO_APPROVE',
      conditions: { supplierNames: ['Fornecedor XYZ'] },
    });

    const entry = await createTestEntry(entriesRepo, {
      supplierName: 'Fornecedor XYZ',
    });

    const result = await sut.execute({
      entryId: entry.id.toString(),
      tenantId: TENANT_ID,
    });

    expect(result.matched).toBe(true);
    expect(result.action).toBe('AUTO_APPROVE');
  });

  it('should not match any rule when none exist', async () => {
    const entry = await createTestEntry(entriesRepo);

    const result = await sut.execute({
      entryId: entry.id.toString(),
      tenantId: TENANT_ID,
    });

    expect(result.matched).toBe(false);
    expect(result.rule).toBeUndefined();
  });

  it('should respect priority ordering (higher priority wins)', async () => {
    await approvalRulesRepo.create({
      tenantId: TENANT_ID,
      name: 'Low priority',
      action: 'FLAG_REVIEW',
      priority: 1,
      maxAmount: 500,
    });

    await approvalRulesRepo.create({
      tenantId: TENANT_ID,
      name: 'High priority',
      action: 'AUTO_APPROVE',
      priority: 10,
      maxAmount: 500,
    });

    const entry = await createTestEntry(entriesRepo, { expectedAmount: 100 });

    const result = await sut.execute({
      entryId: entry.id.toString(),
      tenantId: TENANT_ID,
    });

    expect(result.matched).toBe(true);
    expect(result.rule?.name).toBe('High priority');
    expect(result.action).toBe('AUTO_APPROVE');
  });

  it('should trigger payment when action is AUTO_PAY', async () => {
    await approvalRulesRepo.create({
      tenantId: TENANT_ID,
      name: 'Auto pay small',
      action: 'AUTO_PAY',
      maxAmount: 500,
    });

    const entry = await createTestEntry(entriesRepo, { expectedAmount: 100 });

    const result = await sut.execute({
      entryId: entry.id.toString(),
      tenantId: TENANT_ID,
      createdBy: 'user-123',
    });

    expect(result.matched).toBe(true);
    expect(result.action).toBe('AUTO_PAY');
    expect(mockRegisterPayment.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        entryId: entry.id.toString(),
        tenantId: TENANT_ID,
        amount: 100,
        method: 'TRANSFER',
      }),
    );
  });

  it('should apply multiple conditions as AND logic', async () => {
    const catId = new UniqueEntityID().toString();
    await approvalRulesRepo.create({
      tenantId: TENANT_ID,
      name: 'Combined rule',
      action: 'AUTO_APPROVE',
      maxAmount: 200,
      conditions: {
        categoryIds: [catId],
        supplierNames: ['Fornecedor Confiável'],
        entryType: 'PAYABLE',
      },
    });

    // Entry matches maxAmount and categoryId but not supplierName
    const entry1 = await createTestEntry(entriesRepo, {
      expectedAmount: 100,
      categoryId: catId,
      supplierName: 'Outro Fornecedor',
    });

    const result1 = await sut.execute({
      entryId: entry1.id.toString(),
      tenantId: TENANT_ID,
    });
    expect(result1.matched).toBe(false);

    // Entry matches all conditions
    const entry2 = await createTestEntry(entriesRepo, {
      expectedAmount: 100,
      categoryId: catId,
      supplierName: 'Fornecedor Confiável',
      type: 'PAYABLE',
    });

    const result2 = await sut.execute({
      entryId: entry2.id.toString(),
      tenantId: TENANT_ID,
    });
    expect(result2.matched).toBe(true);
    expect(result2.action).toBe('AUTO_APPROVE');
  });

  it('should skip inactive rules', async () => {
    await approvalRulesRepo.create({
      tenantId: TENANT_ID,
      name: 'Inactive rule',
      action: 'AUTO_APPROVE',
      isActive: false,
      maxAmount: 9999,
    });

    const entry = await createTestEntry(entriesRepo, { expectedAmount: 100 });

    const result = await sut.execute({
      entryId: entry.id.toString(),
      tenantId: TENANT_ID,
    });

    expect(result.matched).toBe(false);
  });

  it('should not match when amount exceeds maxAmount', async () => {
    await approvalRulesRepo.create({
      tenantId: TENANT_ID,
      name: 'Small only',
      action: 'AUTO_APPROVE',
      maxAmount: 50,
    });

    const entry = await createTestEntry(entriesRepo, { expectedAmount: 100 });

    const result = await sut.execute({
      entryId: entry.id.toString(),
      tenantId: TENANT_ID,
    });

    expect(result.matched).toBe(false);
  });

  it('should match rule by entryType condition', async () => {
    await approvalRulesRepo.create({
      tenantId: TENANT_ID,
      name: 'Receivable only',
      action: 'AUTO_APPROVE',
      conditions: { entryType: 'RECEIVABLE' },
    });

    const entryPayable = await createTestEntry(entriesRepo, {
      type: 'PAYABLE',
    });
    const result1 = await sut.execute({
      entryId: entryPayable.id.toString(),
      tenantId: TENANT_ID,
    });
    expect(result1.matched).toBe(false);

    const entryReceivable = await createTestEntry(entriesRepo, {
      type: 'RECEIVABLE',
    });
    const result2 = await sut.execute({
      entryId: entryReceivable.id.toString(),
      tenantId: TENANT_ID,
    });
    expect(result2.matched).toBe(true);
  });

  it('should increment appliedCount when rule matches', async () => {
    const rule = await approvalRulesRepo.create({
      tenantId: TENANT_ID,
      name: 'Count test',
      action: 'FLAG_REVIEW',
      maxAmount: 500,
    });

    expect(rule.appliedCount).toBe(0);

    const entry = await createTestEntry(entriesRepo);
    await sut.execute({
      entryId: entry.id.toString(),
      tenantId: TENANT_ID,
    });

    const updated = await approvalRulesRepo.findById(rule.id, TENANT_ID);
    expect(updated?.appliedCount).toBe(1);
  });

  // Regression: P1-14 — minRecurrence must only count non-CANCELLED entries.
  // Previously a supplier with 2 cancelled invoices + 1 new one would
  // auto-approve under a rule that requires 3 prior entries.
  it('should exclude CANCELLED entries from minRecurrence count', async () => {
    await approvalRulesRepo.create({
      tenantId: TENANT_ID,
      name: 'Recurrent supplier rule',
      action: 'AUTO_APPROVE',
      conditions: {
        supplierNames: ['Fornecedor Recorrente'],
        minRecurrence: 3,
      },
    });

    // Two previous CANCELLED entries with the same supplier
    for (let i = 0; i < 2; i++) {
      const cancelled = await createTestEntry(entriesRepo, {
        supplierName: 'Fornecedor Recorrente',
      });
      await entriesRepo.update({
        id: cancelled.id,
        tenantId: TENANT_ID,
        status: 'CANCELLED',
      });
    }

    // Current entry (PENDING)
    const currentEntry = await createTestEntry(entriesRepo, {
      supplierName: 'Fornecedor Recorrente',
    });

    const result = await sut.execute({
      entryId: currentEntry.id.toString(),
      tenantId: TENANT_ID,
    });

    // Only 1 non-CANCELLED entry (the current one). 1 - 1 = 0 < 3 → no match.
    expect(result.matched).toBe(false);
  });

  it('should match minRecurrence when enough non-CANCELLED entries exist', async () => {
    await approvalRulesRepo.create({
      tenantId: TENANT_ID,
      name: 'Recurrent supplier rule',
      action: 'AUTO_APPROVE',
      conditions: {
        supplierNames: ['Fornecedor Leal'],
        minRecurrence: 2,
      },
    });

    // 3 previous valid entries
    for (let i = 0; i < 3; i++) {
      await createTestEntry(entriesRepo, {
        supplierName: 'Fornecedor Leal',
      });
    }

    // Current entry (PENDING) — 4 total, minus 1 = 3 ≥ 2 → match
    const currentEntry = await createTestEntry(entriesRepo, {
      supplierName: 'Fornecedor Leal',
    });

    const result = await sut.execute({
      entryId: currentEntry.id.toString(),
      tenantId: TENANT_ID,
    });

    expect(result.matched).toBe(true);
  });

  // P3-43: a rule defined with `maxAmount: 0` is degenerate (admin error or
  // a "block everything" guard) — it must NEVER auto-approve real-world
  // entries because every PAYABLE has expectedAmount > 0. The current
  // implementation evaluates `entry.expectedAmount > rule.maxAmount` which
  // returns true for any positive amount → rule does not match. This pins
  // that contract: a maxAmount=0 rule effectively disables itself.
  it('should never match a rule with maxAmount=0 against a positive-amount entry', async () => {
    await approvalRulesRepo.create({
      tenantId: TENANT_ID,
      name: 'Zero ceiling',
      action: 'AUTO_APPROVE',
      maxAmount: 0,
    });

    const entry = await createTestEntry(entriesRepo, { expectedAmount: 0.01 });

    const result = await sut.execute({
      entryId: entry.id.toString(),
      tenantId: TENANT_ID,
    });

    expect(result.matched).toBe(false);
  });

  it('should not match a rule with maxAmount=0 even with very small entries', async () => {
    await approvalRulesRepo.create({
      tenantId: TENANT_ID,
      name: 'Strict zero ceiling',
      action: 'AUTO_PAY',
      maxAmount: 0,
    });

    // Even R$ 0.50 must be rejected by the maxAmount=0 rule
    const entry = await createTestEntry(entriesRepo, { expectedAmount: 0.5 });

    const result = await sut.execute({
      entryId: entry.id.toString(),
      tenantId: TENANT_ID,
      createdBy: 'user-1',
    });

    expect(result.matched).toBe(false);
    expect(mockRegisterPayment.execute).not.toHaveBeenCalled();
  });

  it('should fall back to lower-priority rule when maxAmount=0 rule fails to match', async () => {
    // High-priority maxAmount=0 rule must NOT block lower-priority rules.
    // The evaluator iterates through rules and stops at the first match;
    // since maxAmount=0 never matches, the next valid rule wins.
    await approvalRulesRepo.create({
      tenantId: TENANT_ID,
      name: 'Misconfigured zero',
      action: 'FLAG_REVIEW',
      priority: 100,
      maxAmount: 0,
    });

    await approvalRulesRepo.create({
      tenantId: TENANT_ID,
      name: 'Real auto-approve',
      action: 'AUTO_APPROVE',
      priority: 10,
      maxAmount: 1000,
    });

    const entry = await createTestEntry(entriesRepo, { expectedAmount: 250 });

    const result = await sut.execute({
      entryId: entry.id.toString(),
      tenantId: TENANT_ID,
    });

    expect(result.matched).toBe(true);
    expect(result.rule?.name).toBe('Real auto-approve');
  });
});
