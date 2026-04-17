import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryFinanceCategoriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-categories-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { InMemoryFinanceEntryPaymentsRepository } from '@/repositories/finance/in-memory/in-memory-finance-entry-payments-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock logger to avoid loading @/@env validation during unit tests
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Mock audit queue to avoid Redis connection in tests
vi.mock('@/workers/queues/audit.queue', () => ({
  queueAuditLog: vi.fn().mockResolvedValue(undefined),
}));

import { RegisterPaymentUseCase } from './register-payment';

let entriesRepository: InMemoryFinanceEntriesRepository;
let paymentsRepository: InMemoryFinanceEntryPaymentsRepository;
let categoriesRepository: InMemoryFinanceCategoriesRepository;
let sut: RegisterPaymentUseCase;

describe('RegisterPaymentUseCase', () => {
  beforeEach(() => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    paymentsRepository = new InMemoryFinanceEntryPaymentsRepository();
    categoriesRepository = new InMemoryFinanceCategoriesRepository();
    sut = new RegisterPaymentUseCase(
      entriesRepository,
      paymentsRepository,
      undefined, // calendarSyncService
      categoriesRepository,
    );
  });

  it('should register a payment and mark as PAID', async () => {
    const createdEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Aluguel do escritorio',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 5000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-28'),
    });

    const result = await sut.execute({
      entryId: createdEntry.id.toString(),
      tenantId: 'tenant-1',
      amount: 5000,
      paidAt: new Date('2026-02-15'),
      method: 'PIX',
    });

    expect(result.payment.amount).toBe(5000);
    expect(result.entry.status).toBe('PAID');
    expect(result.entry.actualAmount).toBe(5000);
  });

  it('should register partial payment and mark as PARTIALLY_PAID', async () => {
    const createdEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Conta parcelada',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 10000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-28'),
    });

    const result = await sut.execute({
      entryId: createdEntry.id.toString(),
      tenantId: 'tenant-1',
      amount: 4000,
      paidAt: new Date('2026-02-10'),
      method: 'BANK_TRANSFER',
    });

    expect(result.payment.amount).toBe(4000);
    expect(result.entry.status).toBe('PARTIALLY_PAID');
    expect(result.entry.actualAmount).toBe(4000);
  });

  it('should not pay cancelled entry', async () => {
    const createdEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Conta cancelada',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 3000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-28'),
    });

    entriesRepository.items[0].status = 'CANCELLED';

    await expect(
      sut.execute({
        entryId: createdEntry.id.toString(),
        tenantId: 'tenant-1',
        amount: 3000,
        paidAt: new Date('2026-02-15'),
        method: 'PIX',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not pay already paid entry', async () => {
    const createdEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Conta ja paga',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 2000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-28'),
    });

    entriesRepository.items[0].status = 'PAID';

    await expect(
      sut.execute({
        entryId: createdEntry.id.toString(),
        tenantId: 'tenant-1',
        amount: 2000,
        paidAt: new Date('2026-02-15'),
        method: 'PIX',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not overpay (amount exceeds remaining balance)', async () => {
    const createdEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Conta com pagamento excedente',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 5000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-28'),
    });

    await expect(
      sut.execute({
        entryId: createdEntry.id.toString(),
        tenantId: 'tenant-1',
        amount: 6000,
        paidAt: new Date('2026-02-15'),
        method: 'PIX',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should register a receivable payment and mark as RECEIVED', async () => {
    const createdEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Venda de mercadoria',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 15000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-03-01'),
    });

    const result = await sut.execute({
      entryId: createdEntry.id.toString(),
      tenantId: 'tenant-1',
      amount: 15000,
      paidAt: new Date('2026-02-20'),
      method: 'BANK_TRANSFER',
    });

    expect(result.payment.amount).toBe(15000);
    expect(result.entry.status).toBe('RECEIVED');
    expect(result.entry.actualAmount).toBe(15000);
  });

  // --- RECURRING TESTS ---

  it('should auto-generate next occurrence when paying recurring entry', async () => {
    // Create master entry
    const master = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Aluguel mensal',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 5000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-01'),
      recurrenceType: 'RECURRING',
      recurrenceInterval: 1,
      recurrenceUnit: 'MONTHLY',
    });

    // Create first occurrence (child of master)
    const firstOccurrence = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-002',
      description: 'Aluguel mensal (1)',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 5000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
      recurrenceType: 'RECURRING',
      recurrenceInterval: 1,
      recurrenceUnit: 'MONTHLY',
      currentInstallment: 1,
      parentEntryId: master.id.toString(),
    });

    // Pay the first occurrence
    const result = await sut.execute({
      entryId: firstOccurrence.id.toString(),
      tenantId: 'tenant-1',
      amount: 5000,
      paidAt: new Date('2026-02-01'),
      method: 'PIX',
    });

    expect(result.entry.status).toBe('PAID');
    expect(result.nextOccurrence).toBeDefined();
    expect(result.nextOccurrence!.currentInstallment).toBe(2);
    expect(result.nextOccurrence!.description).toBe('Aluguel mensal (2)');
    expect(result.nextOccurrence!.parentEntryId).toBe(master.id.toString());

    // 3 entries total: master + occurrence 1 + occurrence 2
    expect(entriesRepository.items).toHaveLength(3);
  });

  it('should not generate next occurrence for partial recurring payment', async () => {
    const master = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Aluguel',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 5000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-01'),
      recurrenceType: 'RECURRING',
    });

    const occurrence = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-002',
      description: 'Aluguel (1)',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 5000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
      recurrenceType: 'RECURRING',
      recurrenceInterval: 1,
      recurrenceUnit: 'MONTHLY',
      currentInstallment: 1,
      parentEntryId: master.id.toString(),
    });

    const result = await sut.execute({
      entryId: occurrence.id.toString(),
      tenantId: 'tenant-1',
      amount: 2000,
      paidAt: new Date('2026-02-01'),
      method: 'PIX',
    });

    expect(result.entry.status).toBe('PARTIALLY_PAID');
    expect(result.nextOccurrence).toBeUndefined();
    // Still only 2 entries
    expect(entriesRepository.items).toHaveLength(2);
  });

  // --- INSTALLMENT TESTS ---

  it('should mark master as PAID when all installments are paid', async () => {
    // Create master entry
    const master = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Financiamento',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 3000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
      recurrenceType: 'INSTALLMENT',
      totalInstallments: 3,
    });

    // Create 3 installments
    const installment1 = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-002',
      description: 'Financiamento (1/3)',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 1000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
      recurrenceType: 'INSTALLMENT',
      currentInstallment: 1,
      parentEntryId: master.id.toString(),
    });

    const installment2 = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-003',
      description: 'Financiamento (2/3)',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 1000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-03-01'),
      recurrenceType: 'INSTALLMENT',
      currentInstallment: 2,
      parentEntryId: master.id.toString(),
    });

    const installment3 = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-004',
      description: 'Financiamento (3/3)',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 1000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-04-01'),
      recurrenceType: 'INSTALLMENT',
      currentInstallment: 3,
      parentEntryId: master.id.toString(),
    });

    // Pay installment 1
    await sut.execute({
      entryId: installment1.id.toString(),
      tenantId: 'tenant-1',
      amount: 1000,
      paidAt: new Date('2026-02-01'),
      method: 'PIX',
    });

    // Master should still be PENDING
    const masterAfterFirst = entriesRepository.items.find((i) =>
      i.id.equals(master.id),
    );
    expect(masterAfterFirst!.status).toBe('PENDING');

    // Pay installment 2
    await sut.execute({
      entryId: installment2.id.toString(),
      tenantId: 'tenant-1',
      amount: 1000,
      paidAt: new Date('2026-03-01'),
      method: 'PIX',
    });

    // Master should still be PENDING
    expect(masterAfterFirst!.status).toBe('PENDING');

    // Pay installment 3 (last one)
    await sut.execute({
      entryId: installment3.id.toString(),
      tenantId: 'tenant-1',
      amount: 1000,
      paidAt: new Date('2026-04-01'),
      method: 'PIX',
    });

    // Now master should be PAID
    const masterAfterAll = entriesRepository.items.find((i) =>
      i.id.equals(master.id),
    );
    expect(masterAfterAll!.status).toBe('PAID');
  });

  // --- AUTO LATE-FEE TESTS ---

  it('should auto-calculate interest and penalty for overdue entry with category rates', async () => {
    // Create category with rates: 2% monthly interest, 2% penalty
    const category = await categoriesRepository.create({
      tenantId: 'tenant-1',
      name: 'Fornecedores',
      slug: 'fornecedores',
      type: 'EXPENSE',
      isActive: true,
      interestRate: 0.02, // 2% per month
      penaltyRate: 0.02, // 2% flat penalty
    });

    const createdEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Conta vencida',
      categoryId: category.id.toString(),
      costCenterId: 'cost-center-1',
      expectedAmount: 10000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    // Pay 30 days late
    const result = await sut.execute({
      entryId: createdEntry.id.toString(),
      tenantId: 'tenant-1',
      amount: 10400, // 10000 + 200 interest + 200 penalty
      paidAt: new Date('2026-03-03'), // 30 days overdue
    });

    // Interest: 10000 * (0.02/30) * 30 = 200
    expect(result.calculatedInterest).toBe(200);
    // Penalty: 10000 * 0.02 = 200
    expect(result.calculatedPenalty).toBe(200);
    expect(result.entry.interest).toBe(200);
    expect(result.entry.penalty).toBe(200);
    expect(result.entry.status).toBe('PAID');
  });

  it('should use caller-provided interest/penalty overrides', async () => {
    const category = await categoriesRepository.create({
      tenantId: 'tenant-1',
      name: 'Fornecedores',
      slug: 'fornecedores-2',
      type: 'EXPENSE',
      isActive: true,
      interestRate: 0.02,
      penaltyRate: 0.02,
    });

    const createdEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-002',
      description: 'Conta com override',
      categoryId: category.id.toString(),
      costCenterId: 'cost-center-1',
      expectedAmount: 10000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    // Caller overrides interest and penalty
    const result = await sut.execute({
      entryId: createdEntry.id.toString(),
      tenantId: 'tenant-1',
      amount: 10500, // 10000 + 300 interest + 200 penalty
      paidAt: new Date('2026-03-03'),
      interest: 300,
      penalty: 200,
    });

    // Should use caller-provided values, not auto-calculated
    expect(result.calculatedInterest).toBe(300);
    expect(result.calculatedPenalty).toBe(200);
    expect(result.entry.interest).toBe(300);
    expect(result.entry.penalty).toBe(200);
    expect(result.entry.status).toBe('PAID');
  });

  it('should not add interest/penalty for non-overdue entry', async () => {
    const category = await categoriesRepository.create({
      tenantId: 'tenant-1',
      name: 'Fornecedores',
      slug: 'fornecedores-3',
      type: 'EXPENSE',
      isActive: true,
      interestRate: 0.02,
      penaltyRate: 0.02,
    });

    const createdEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-003',
      description: 'Conta em dia',
      categoryId: category.id.toString(),
      costCenterId: 'cost-center-1',
      expectedAmount: 5000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-03-01'),
    });

    // Pay on time (before due date)
    const result = await sut.execute({
      entryId: createdEntry.id.toString(),
      tenantId: 'tenant-1',
      amount: 5000,
      paidAt: new Date('2026-02-15'),
    });

    expect(result.calculatedInterest).toBeUndefined();
    expect(result.calculatedPenalty).toBeUndefined();
    expect(result.entry.interest).toBe(0);
    expect(result.entry.penalty).toBe(0);
    expect(result.entry.status).toBe('PAID');
  });

  // --- IDEMPOTENCY TESTS ---

  it('should return cached result when idempotencyKey already exists', async () => {
    const createdEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-IDEMP',
      description: 'Idempotency test',
      categoryId: 'category-1',
      expectedAmount: 5000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-28'),
    });

    const idempotencyKey = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

    // First call: should create the payment
    const firstResult = await sut.execute({
      entryId: createdEntry.id.toString(),
      tenantId: 'tenant-1',
      amount: 5000,
      paidAt: new Date('2026-02-15'),
      method: 'PIX',
      idempotencyKey,
    });

    expect(firstResult.payment.amount).toBe(5000);
    expect(firstResult.entry.status).toBe('PAID');
    expect(paymentsRepository.items).toHaveLength(1);

    // Second call with same idempotencyKey: should return cached result, NOT create duplicate
    const secondResult = await sut.execute({
      entryId: createdEntry.id.toString(),
      tenantId: 'tenant-1',
      amount: 5000,
      paidAt: new Date('2026-02-15'),
      method: 'PIX',
      idempotencyKey,
    });

    expect(secondResult.payment.amount).toBe(5000);
    // Should still be only 1 payment
    expect(paymentsRepository.items).toHaveLength(1);
  });

  // P2-54 — edge-case coverage
  it('should reject when amount > expectedAmount (over-due cap)', async () => {
    const createdEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-OVER',
      description: 'Conta com over-payment',
      categoryId: 'category-1',
      expectedAmount: 1000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-28'),
    });

    await expect(
      sut.execute({
        entryId: createdEntry.id.toString(),
        tenantId: 'tenant-1',
        amount: 1500, // 50% above totalDue
        paidAt: new Date('2026-02-15'),
        method: 'PIX',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  // P2-54 — a future paidAt must still be accepted: the bank sometimes
  // sends the posting-date a few hours ahead of UTC now(). The use case
  // should not crash, and the entry should land as PAID.
  it('should accept a paidAt in the near future without crashing', async () => {
    const createdEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-FUTURE',
      description: 'Pagamento com paidAt no futuro',
      categoryId: 'category-1',
      expectedAmount: 1000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-28'),
    });

    const nearFuture = new Date(Date.now() + 6 * 60 * 60 * 1000); // +6h

    const result = await sut.execute({
      entryId: createdEntry.id.toString(),
      tenantId: 'tenant-1',
      amount: 1000,
      paidAt: nearFuture,
      method: 'PIX',
    });

    expect(result.entry.status).toBe('PAID');
    expect(result.payment.paidAt.toISOString()).toBe(nearFuture.toISOString());
  });

  // P2-54 — paidAt inside a locked period. The use case itself does NOT
  // own period-lock enforcement (that lives in the controller / create &
  // update entry flows), but we document the current contract here: a
  // past paidAt in a "would-be-locked" month still goes through at the
  // use-case level. If / when period-lock enforcement is pushed down
  // into the use case, this spec will break and force the decision to
  // be revisited explicitly.
  it('should currently register a payment dated inside a historical period (period-lock enforced upstream)', async () => {
    const createdEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-LOCKED',
      description: 'Pagamento retroativo',
      categoryId: 'category-1',
      expectedAmount: 2000,
      issueDate: new Date('2025-01-01'),
      dueDate: new Date('2025-01-31'),
    });

    const result = await sut.execute({
      entryId: createdEntry.id.toString(),
      tenantId: 'tenant-1',
      amount: 2000,
      paidAt: new Date('2025-01-15'), // well inside a "would be locked" month
      method: 'PIX',
    });

    expect(result.entry.status).toBe('PAID');
  });

  it('should not calculate interest/penalty when category has no rates', async () => {
    // Category without rates
    const category = await categoriesRepository.create({
      tenantId: 'tenant-1',
      name: 'Sem taxas',
      slug: 'sem-taxas',
      type: 'EXPENSE',
      isActive: true,
      // no interestRate, no penaltyRate
    });

    const createdEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-004',
      description: 'Conta sem taxas',
      categoryId: category.id.toString(),
      costCenterId: 'cost-center-1',
      expectedAmount: 5000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    // Pay overdue but category has no rates
    const result = await sut.execute({
      entryId: createdEntry.id.toString(),
      tenantId: 'tenant-1',
      amount: 5000,
      paidAt: new Date('2026-03-01'), // 28 days overdue
    });

    expect(result.calculatedInterest).toBeUndefined();
    expect(result.calculatedPenalty).toBeUndefined();
    expect(result.entry.interest).toBe(0);
    expect(result.entry.penalty).toBe(0);
    expect(result.entry.status).toBe('PAID');
  });
});
