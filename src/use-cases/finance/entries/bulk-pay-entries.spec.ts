import { InMemoryFinanceApprovalRulesRepository } from '@/repositories/finance/in-memory/in-memory-finance-approval-rules-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { InMemoryFinanceEntryPaymentsRepository } from '@/repositories/finance/in-memory/in-memory-finance-entry-payments-repository';
import type { TransactionManager } from '@/lib/transaction-manager';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BulkPayEntriesUseCase } from './bulk-pay-entries';

vi.mock('@/workers/queues/audit.queue', () => ({
  queueAuditLog: vi.fn().mockResolvedValue(undefined),
}));

const fakeTransactionManager: TransactionManager = {
  run: async (fn) => fn({} as never),
};

let entriesRepository: InMemoryFinanceEntriesRepository;
let paymentsRepository: InMemoryFinanceEntryPaymentsRepository;
let sut: BulkPayEntriesUseCase;

describe('BulkPayEntriesUseCase', () => {
  beforeEach(() => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    paymentsRepository = new InMemoryFinanceEntryPaymentsRepository();
    sut = new BulkPayEntriesUseCase(
      entriesRepository,
      paymentsRepository,
      fakeTransactionManager,
    );
  });

  it('should pay multiple entries successfully', async () => {
    const entry1 = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Conta a pagar 1',
      categoryId: 'category-1',
      expectedAmount: 1000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    const entry2 = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Conta a receber 1',
      categoryId: 'category-1',
      expectedAmount: 2000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryIds: [entry1.id.toString(), entry2.id.toString()],
      bankAccountId: 'bank-1',
      method: 'PIX',
    });

    expect(result.succeeded).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.errors).toHaveLength(0);

    const updatedEntry1 = await entriesRepository.findById(
      entry1.id,
      'tenant-1',
    );
    expect(updatedEntry1!.status).toBe('PAID');

    const updatedEntry2 = await entriesRepository.findById(
      entry2.id,
      'tenant-1',
    );
    expect(updatedEntry2!.status).toBe('RECEIVED');

    expect(paymentsRepository.items).toHaveLength(2);
  });

  it('should skip entries that are already paid', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Conta ja paga',
      categoryId: 'category-1',
      expectedAmount: 1000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
      status: 'PAID',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryIds: [entry.id.toString()],
      bankAccountId: 'bank-1',
      method: 'PIX',
    });

    expect(result.succeeded).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.errors[0].error).toContain('PAID');
  });

  it('should skip entries not found', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryIds: ['non-existent-id'],
      bankAccountId: 'bank-1',
      method: 'PIX',
    });

    expect(result.succeeded).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.errors[0].error).toBe('Entry not found');
  });

  it('should handle mix of valid and invalid entries', async () => {
    const validEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Conta valida',
      categoryId: 'category-1',
      expectedAmount: 1000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    const cancelledEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-002',
      description: 'Conta cancelada',
      categoryId: 'category-1',
      expectedAmount: 500,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
      status: 'CANCELLED',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryIds: [
        validEntry.id.toString(),
        cancelledEntry.id.toString(),
        'non-existent-id',
      ],
      bankAccountId: 'bank-1',
      method: 'PIX',
    });

    expect(result.succeeded).toBe(1);
    expect(result.failed).toBe(2);
  });

  it('should skip entries that require approval but are not approved', async () => {
    const approvalRulesRepository =
      new InMemoryFinanceApprovalRulesRepository();

    // Create a FLAG_REVIEW rule: entries OVER R$1000 require approval
    await approvalRulesRepository.create({
      tenantId: 'tenant-1',
      name: 'Review entries above R$1000',
      isActive: true,
      action: 'FLAG_REVIEW',
      maxAmount: 1000,
    });

    const sutWithApproval = new BulkPayEntriesUseCase(
      entriesRepository,
      paymentsRepository,
      fakeTransactionManager,
      approvalRulesRepository,
    );

    // Entry ABOVE threshold WITHOUT approval tag — should be blocked
    const unapprovedEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-UNAP',
      description: 'Requires approval',
      categoryId: 'category-1',
      expectedAmount: 5000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    // Entry ABOVE threshold WITH approval tag — should succeed
    const approvedEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-APPR',
      description: 'Already approved',
      categoryId: 'category-1',
      expectedAmount: 3000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
      tags: ['auto-approved'],
    });

    const result = await sutWithApproval.execute({
      tenantId: 'tenant-1',
      entryIds: [unapprovedEntry.id.toString(), approvedEntry.id.toString()],
      bankAccountId: 'bank-1',
      method: 'PIX',
    });

    // Approved entry should succeed, unapproved should fail
    expect(result.succeeded).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.errors[0].error).toContain('aprovação');
  });

  it('should require approval for entries ABOVE the rule maxAmount threshold', async () => {
    const approvalRulesRepository =
      new InMemoryFinanceApprovalRulesRepository();

    // FLAG_REVIEW rule: any entry > R$500 requires approval
    await approvalRulesRepository.create({
      tenantId: 'tenant-1',
      name: 'Review above R$500',
      isActive: true,
      action: 'FLAG_REVIEW',
      maxAmount: 500,
    });

    const sutWithApproval = new BulkPayEntriesUseCase(
      entriesRepository,
      paymentsRepository,
      fakeTransactionManager,
      approvalRulesRepository,
    );

    const largeEntryAboveThreshold = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-LARGE',
      description: 'R$1000 entry — must require approval',
      categoryId: 'category-1',
      expectedAmount: 1000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    const result = await sutWithApproval.execute({
      tenantId: 'tenant-1',
      entryIds: [largeEntryAboveThreshold.id.toString()],
      bankAccountId: 'bank-1',
      method: 'PIX',
    });

    expect(result.succeeded).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.errors[0].error).toContain('aprovação');
  });

  it('should NOT require approval for entries below the rule maxAmount threshold', async () => {
    const approvalRulesRepository =
      new InMemoryFinanceApprovalRulesRepository();

    // FLAG_REVIEW rule: any entry > R$500 requires approval
    await approvalRulesRepository.create({
      tenantId: 'tenant-1',
      name: 'Review above R$500',
      isActive: true,
      action: 'FLAG_REVIEW',
      maxAmount: 500,
    });

    const sutWithApproval = new BulkPayEntriesUseCase(
      entriesRepository,
      paymentsRepository,
      fakeTransactionManager,
      approvalRulesRepository,
    );

    const smallEntryBelowThreshold = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-SMALL',
      description: 'R$100 entry — should pay without approval',
      categoryId: 'category-1',
      expectedAmount: 100,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    const result = await sutWithApproval.execute({
      tenantId: 'tenant-1',
      entryIds: [smallEntryBelowThreshold.id.toString()],
      bankAccountId: 'bank-1',
      method: 'PIX',
    });

    expect(result.succeeded).toBe(1);
    expect(result.failed).toBe(0);
  });

  it('should require approval when rule has no maxAmount (blanket rule)', async () => {
    const approvalRulesRepository =
      new InMemoryFinanceApprovalRulesRepository();

    // Blanket FLAG_REVIEW rule: every entry must be approved
    await approvalRulesRepository.create({
      tenantId: 'tenant-1',
      name: 'Review every entry',
      isActive: true,
      action: 'FLAG_REVIEW',
    });

    const sutWithApproval = new BulkPayEntriesUseCase(
      entriesRepository,
      paymentsRepository,
      fakeTransactionManager,
      approvalRulesRepository,
    );

    const tinyEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-TINY',
      description: 'R$10 entry — blanket rule must still require approval',
      categoryId: 'category-1',
      expectedAmount: 10,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    const result = await sutWithApproval.execute({
      tenantId: 'tenant-1',
      entryIds: [tinyEntry.id.toString()],
      bankAccountId: 'bank-1',
      method: 'PIX',
    });

    expect(result.succeeded).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.errors[0].error).toContain('aprovação');
  });

  it('should not pay entries from another tenant', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-other',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Conta de outro tenant',
      categoryId: 'category-1',
      expectedAmount: 1000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryIds: [entry.id.toString()],
      bankAccountId: 'bank-1',
      method: 'PIX',
    });

    expect(result.succeeded).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.errors[0].error).toBe('Entry not found');
  });

  // ─── P2-59: Multi-tenant isolation edge cases ──────────────────────
  // A compromised / malicious request that mixes ids from two tenants
  // (leaked UUIDs, speculative id guessing) must not be able to settle
  // entries from a different tenant. `findByIdForUpdate(id, tenantId, tx)`
  // is the guard — these tests regress that contract end-to-end.
  it('should isolate tenants when entryIds mix own and foreign ids', async () => {
    // Own entry (tenant-1) — valid, should be paid
    const ownEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-OWN',
      description: 'Conta própria',
      categoryId: 'category-1',
      expectedAmount: 1000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    // Foreign entry (tenant-2) — must be rejected as "not found"
    const foreignEntry = await entriesRepository.create({
      tenantId: 'tenant-2',
      type: 'PAYABLE',
      code: 'PAG-FOREIGN',
      description: 'Conta de outro tenant',
      categoryId: 'category-2',
      expectedAmount: 5000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryIds: [ownEntry.id.toString(), foreignEntry.id.toString()],
      bankAccountId: 'bank-1',
      method: 'PIX',
    });

    expect(result.succeeded).toBe(1);
    expect(result.failed).toBe(1);

    const foreignError = result.errors.find(
      (bulkError) => bulkError.entryId === foreignEntry.id.toString(),
    );
    expect(foreignError?.error).toBe('Entry not found');

    // Foreign entry must remain PENDING in its own tenant
    const foreignRefreshed = await entriesRepository.findById(
      foreignEntry.id,
      'tenant-2',
    );
    expect(foreignRefreshed!.status).toBe('PENDING');
    expect(foreignRefreshed!.actualAmount).toBeUndefined();

    // Own entry was paid successfully
    const ownRefreshed = await entriesRepository.findById(
      ownEntry.id,
      'tenant-1',
    );
    expect(ownRefreshed!.status).toBe('PAID');
  });

  it('should reject ALL foreign entries when every id belongs to another tenant', async () => {
    const foreignEntry1 = await entriesRepository.create({
      tenantId: 'tenant-2',
      type: 'PAYABLE',
      code: 'PAG-F1',
      description: 'Foreign 1',
      categoryId: 'category-1',
      expectedAmount: 500,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    const foreignEntry2 = await entriesRepository.create({
      tenantId: 'tenant-2',
      type: 'PAYABLE',
      code: 'PAG-F2',
      description: 'Foreign 2',
      categoryId: 'category-1',
      expectedAmount: 750,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryIds: [foreignEntry1.id.toString(), foreignEntry2.id.toString()],
      bankAccountId: 'bank-1',
      method: 'PIX',
    });

    expect(result.succeeded).toBe(0);
    expect(result.failed).toBe(2);
    expect(result.errors.every((e) => e.error === 'Entry not found')).toBe(
      true,
    );

    // No payments created for either foreign entry
    const payments1 = paymentsRepository.items.filter(
      (p) => p.entryId.toString() === foreignEntry1.id.toString(),
    );
    const payments2 = paymentsRepository.items.filter(
      (p) => p.entryId.toString() === foreignEntry2.id.toString(),
    );
    expect(payments1).toHaveLength(0);
    expect(payments2).toHaveLength(0);
  });

  // Regression: P1-10 — actualAmount must account for previously-registered
  // partial payments. The final value should be (existing payments sum +
  // remaining balance settled), not the raw totalDue lookup.
  it('should compute actualAmount as existing partial payments plus the new settlement', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-100',
      description: 'Entrada com pagamento parcial prévio',
      categoryId: 'category-1',
      expectedAmount: 1000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    // Prior partial payment of 400 (manually registered, e.g. via another flow)
    await paymentsRepository.create({
      entryId: entry.id.toString(),
      amount: 400,
      paidAt: new Date('2026-01-15'),
      method: 'PIX',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryIds: [entry.id.toString()],
      bankAccountId: 'bank-1',
      method: 'PIX',
    });

    expect(result.succeeded).toBe(1);
    expect(result.failed).toBe(0);

    const updated = await entriesRepository.findById(entry.id, 'tenant-1');
    expect(updated!.status).toBe('PAID');
    // 400 (existing) + 600 (bulk-pay settled) = 1000 = totalDue
    expect(updated!.actualAmount).toBe(1000);

    // Bulk-pay should have created exactly one new payment covering the
    // 600 remaining balance — not the full 1000.
    const paymentsForEntry = paymentsRepository.items.filter(
      (p) => p.entryId.toString() === entry.id.toString(),
    );
    expect(paymentsForEntry).toHaveLength(2);
    const bulkPayment = paymentsForEntry.find((p) => p.bankAccountId);
    expect(bulkPayment!.amount).toBe(600);
  });
});
