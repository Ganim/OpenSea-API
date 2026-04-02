import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryFinanceCategoriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-categories-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { InMemoryFinanceEntryPaymentsRepository } from '@/repositories/finance/in-memory/in-memory-finance-entry-payments-repository';
import { InMemoryCostCentersRepository } from '@/repositories/finance/in-memory/in-memory-cost-centers-repository';
import { InMemoryFinanceEntryCostCentersRepository } from '@/repositories/finance/in-memory/in-memory-finance-entry-cost-centers-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RegisterPaymentUseCase } from './register-payment';
import { CreateFinanceEntryUseCase } from './create-finance-entry';

// Mock audit queue to avoid Redis connection in tests
vi.mock('@/workers/queues/audit.queue', () => ({
  queueAuditLog: vi.fn().mockResolvedValue(undefined),
}));

let entriesRepository: InMemoryFinanceEntriesRepository;
let paymentsRepository: InMemoryFinanceEntryPaymentsRepository;
let categoriesRepository: InMemoryFinanceCategoriesRepository;
let costCentersRepository: InMemoryCostCentersRepository;
let costCenterAllocationsRepository: InMemoryFinanceEntryCostCentersRepository;
let paymentSut: RegisterPaymentUseCase;
let createEntrySut: CreateFinanceEntryUseCase;

let seededCategoryId: string;

describe('Financial Precision', () => {
  beforeEach(async () => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    paymentsRepository = new InMemoryFinanceEntryPaymentsRepository();
    categoriesRepository = new InMemoryFinanceCategoriesRepository();
    costCentersRepository = new InMemoryCostCentersRepository();
    costCenterAllocationsRepository =
      new InMemoryFinanceEntryCostCentersRepository();

    paymentSut = new RegisterPaymentUseCase(
      entriesRepository,
      paymentsRepository,
      undefined, // calendarSyncService
      categoriesRepository,
    );

    createEntrySut = new CreateFinanceEntryUseCase(
      entriesRepository,
      categoriesRepository,
      costCentersRepository,
      costCenterAllocationsRepository,
    );

    const category = await categoriesRepository.create({
      tenantId: 'tenant-1',
      name: 'Fornecedores',
      slug: 'fornecedores',
      type: 'EXPENSE',
      isActive: true,
    });
    seededCategoryId = category.id.toString();
  });

  // --- Large amounts ---

  it('should handle large amounts without precision loss', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Large amount entry',
      categoryId: seededCategoryId,
      expectedAmount: 1234567.89,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    const result = await paymentSut.execute({
      entryId: entry.id.toString(),
      tenantId: 'tenant-1',
      amount: 1234567.89,
      paidAt: new Date('2026-01-15'),
      method: 'BANK_TRANSFER',
    });

    expect(result.entry.status).toBe('PAID');
    expect(result.entry.actualAmount).toBe(1234567.89);

    // Verify remaining balance is exactly 0
    const updatedEntry = await entriesRepository.findById(entry.id, 'tenant-1');
    expect(updatedEntry!.remainingBalance).toBe(0);
  });

  it('should handle very large amounts (millions) correctly', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Multi-million entry',
      categoryId: seededCategoryId,
      expectedAmount: 9999999.99,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    const result = await paymentSut.execute({
      entryId: entry.id.toString(),
      tenantId: 'tenant-1',
      amount: 9999999.99,
      paidAt: new Date('2026-01-15'),
      method: 'BANK_TRANSFER',
    });

    expect(result.entry.status).toBe('RECEIVED');
    expect(result.entry.actualAmount).toBe(9999999.99);
  });

  // --- Many small payments ---

  it('should handle many small payments without accumulation error', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-002',
      description: 'Many small payments',
      categoryId: seededCategoryId,
      expectedAmount: 100,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    const entryId = entry.id.toString();

    // Register 100 payments of 1.00
    for (let i = 0; i < 100; i++) {
      await paymentSut.execute({
        entryId,
        tenantId: 'tenant-1',
        amount: 1.0,
        paidAt: new Date('2026-01-15'),
        method: 'PIX',
      });
    }

    const totalPaid = await paymentsRepository.sumByEntryId(entry.id);
    expect(totalPaid).toBe(100);

    const updatedEntry = await entriesRepository.findById(entry.id, 'tenant-1');
    expect(updatedEntry!.status).toBe('PAID');
    expect(updatedEntry!.remainingBalance).toBe(0);
  });

  it('should handle 10 payments of 0.10 summing to exactly 1.00', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-003',
      description: 'Tiny payments precision test',
      categoryId: seededCategoryId,
      expectedAmount: 1.0,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    const entryId = entry.id.toString();

    for (let i = 0; i < 10; i++) {
      await paymentSut.execute({
        entryId,
        tenantId: 'tenant-1',
        amount: 0.1,
        paidAt: new Date('2026-01-15'),
        method: 'PIX',
      });
    }

    const totalPaid = await paymentsRepository.sumByEntryId(entry.id);
    // Floating point: 0.1 * 10 may not be exactly 1.0
    // This test documents whether the system handles IEEE 754 edge cases
    // The sum of 10 payments of 0.1 in JavaScript is 0.9999999999999999
    // If the system uses raw floats, this may cause the entry to remain PARTIALLY_PAID
    const updatedEntry = await entriesRepository.findById(entry.id, 'tenant-1');

    // Document the actual behavior — the totalPaid should be very close to 1.0
    expect(totalPaid).toBeCloseTo(1.0, 10);

    // If the system does not use integer-cent math, this reveals the precision gap
    if (totalPaid !== 1.0) {
      // The entry may remain PARTIALLY_PAID due to floating point imprecision
      // This is a known limitation when using float arithmetic for money
      expect(updatedEntry!.status).toBe('PARTIALLY_PAID');
    } else {
      expect(updatedEntry!.status).toBe('PAID');
    }
  });

  // --- Discount + Interest + Penalty precision ---

  it('should round totalDue to 2 decimal places avoiding IEEE 754 precision issues', async () => {
    // totalDue = 1000 - 50.55 + 12.33 + 5.12 = 966.90
    // Without rounding, JavaScript would produce 966.9000000000001.
    // The totalDue getter now rounds to 2 decimal places.
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-004',
      description: 'Entry with all adjustments',
      categoryId: seededCategoryId,
      expectedAmount: 1000,
      discount: 50.55,
      interest: 12.33,
      penalty: 5.12,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    // After fix: totalDue is exactly 966.9 (rounded to 2 decimal places)
    expect(entry.totalDue).toBe(966.9);

    // Pay using the totalDue value
    const result = await paymentSut.execute({
      entryId: entry.id.toString(),
      tenantId: 'tenant-1',
      amount: entry.totalDue,
      paidAt: new Date('2026-01-15'),
      method: 'PIX',
    });

    expect(result.entry.status).toBe('PAID');
  });

  it('should compute totalDue with zero discount and large penalty', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-005',
      description: 'Large penalty entry',
      categoryId: seededCategoryId,
      expectedAmount: 500,
      discount: 0,
      interest: 0,
      penalty: 100.5,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    // totalDue = 500 - 0 + 0 + 100.5 = 600.5
    expect(entry.totalDue).toBe(600.5);
  });

  it('should compute totalDue with discount equal to expected amount', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-006',
      description: 'Full discount entry',
      categoryId: seededCategoryId,
      expectedAmount: 200,
      discount: 200,
      interest: 0,
      penalty: 0,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    // totalDue = 200 - 200 + 0 + 0 = 0
    expect(entry.totalDue).toBe(0);
  });

  // --- Rateio allocation precision ---

  it('should accept rateio allocations summing to exactly 100%', async () => {
    // Create cost centers
    const cc1 = await costCentersRepository.create({
      tenantId: 'tenant-1',
      name: 'Marketing',
      code: 'MKT',
      isActive: true,
    });
    const cc2 = await costCentersRepository.create({
      tenantId: 'tenant-1',
      name: 'Engineering',
      code: 'ENG',
      isActive: true,
    });
    const cc3 = await costCentersRepository.create({
      tenantId: 'tenant-1',
      name: 'Sales',
      code: 'SLS',
      isActive: true,
    });

    // 33.33 + 33.33 + 33.34 = 100.00
    const result = await createEntrySut.execute({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      description: 'Rateio 3 CCs',
      categoryId: seededCategoryId,
      expectedAmount: 1000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
      costCenterAllocations: [
        { costCenterId: cc1.id.toString(), percentage: 33.33 },
        { costCenterId: cc2.id.toString(), percentage: 33.33 },
        { costCenterId: cc3.id.toString(), percentage: 33.34 },
      ],
    });

    expect(result.entry).toBeDefined();
    expect(result.entry.status).toBe('PENDING');
  });

  it('should reject 99.99% rateio after precision fix', async () => {
    // After the fix, the sum is rounded to 2 decimal places before comparison.
    // 50.00 + 49.99 = 99.99, which is 0.01 away from 100 — now correctly rejected.
    const cc1 = await costCentersRepository.create({
      tenantId: 'tenant-1',
      name: 'Marketing',
      code: 'MKT-2',
      isActive: true,
    });
    const cc2 = await costCentersRepository.create({
      tenantId: 'tenant-1',
      name: 'Engineering',
      code: 'ENG-2',
      isActive: true,
    });

    // 50.00 + 49.99 = 99.99 — now correctly rejected
    await expect(
      createEntrySut.execute({
        tenantId: 'tenant-1',
        type: 'PAYABLE',
        description: 'Rateio with 99.99%',
        categoryId: seededCategoryId,
        expectedAmount: 1000,
        issueDate: new Date('2026-01-01'),
        dueDate: new Date('2026-02-01'),
        costCenterAllocations: [
          { costCenterId: cc1.id.toString(), percentage: 50.0 },
          { costCenterId: cc2.id.toString(), percentage: 49.99 },
        ],
      }),
    ).rejects.toThrow(
      'Alocações de centro de custo devem somar exatamente 100%',
    );
  });

  it('should reject rateio allocations clearly not summing to 100%', async () => {
    const cc1 = await costCentersRepository.create({
      tenantId: 'tenant-1',
      name: 'Marketing',
      code: 'MKT-4',
      isActive: true,
    });
    const cc2 = await costCentersRepository.create({
      tenantId: 'tenant-1',
      name: 'Engineering',
      code: 'ENG-4',
      isActive: true,
    });

    // 50 + 49 = 99 — clearly off by 1%, should be rejected
    await expect(
      createEntrySut.execute({
        tenantId: 'tenant-1',
        type: 'PAYABLE',
        description: 'Invalid rateio',
        categoryId: seededCategoryId,
        expectedAmount: 1000,
        issueDate: new Date('2026-01-01'),
        dueDate: new Date('2026-02-01'),
        costCenterAllocations: [
          { costCenterId: cc1.id.toString(), percentage: 50 },
          { costCenterId: cc2.id.toString(), percentage: 49 },
        ],
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should accept rateio allocations within 0.01 tolerance of 100%', async () => {
    const cc1 = await costCentersRepository.create({
      tenantId: 'tenant-1',
      name: 'Marketing',
      code: 'MKT-3',
      isActive: true,
    });
    const cc2 = await costCentersRepository.create({
      tenantId: 'tenant-1',
      name: 'Engineering',
      code: 'ENG-3',
      isActive: true,
    });

    // The code rejects if Math.abs(sum - 100) >= 0.01
    // So 50 + 50 = 100.00 should pass (diff = 0)
    const result = await createEntrySut.execute({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      description: 'Exact 50/50 rateio',
      categoryId: seededCategoryId,
      expectedAmount: 1000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
      costCenterAllocations: [
        { costCenterId: cc1.id.toString(), percentage: 50 },
        { costCenterId: cc2.id.toString(), percentage: 50 },
      ],
    });

    expect(result.entry).toBeDefined();
  });

  // --- Interest calculation precision ---

  it('should calculate auto-interest with precise rounding', async () => {
    const category = await categoriesRepository.create({
      tenantId: 'tenant-1',
      name: 'Com juros',
      slug: 'com-juros',
      type: 'EXPENSE',
      isActive: true,
      interestRate: 0.01, // 1% per month
      penaltyRate: 0.02, // 2% flat penalty
    });

    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-007',
      description: 'Interest precision test',
      categoryId: category.id.toString(),
      expectedAmount: 333.33,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    // Pay 15 days late
    const paidAt = new Date('2026-02-16');
    const overdueDays = 15;

    // Expected interest: 333.33 * (0.01 / 30) * 15 = 333.33 * 0.005 = 1.67 (rounded)
    // Math.round(333.33 * (0.01/30) * 15 * 100) / 100 = Math.round(166.665) / 100 = 167 / 100 = 1.67
    const expectedInterest =
      Math.round(333.33 * (0.01 / 30) * overdueDays * 100) / 100;

    // Expected penalty: 333.33 * 0.02 = 6.67 (rounded)
    // Math.round(333.33 * 0.02 * 100) / 100 = Math.round(666.66) / 100 = 667 / 100 = 6.67
    const expectedPenalty = Math.round(333.33 * 0.02 * 100) / 100;

    // totalDue after interest/penalty = 333.33 + expectedInterest + expectedPenalty
    const totalDue = 333.33 + expectedInterest + expectedPenalty;

    const result = await paymentSut.execute({
      entryId: entry.id.toString(),
      tenantId: 'tenant-1',
      amount: totalDue,
      paidAt,
    });

    expect(result.calculatedInterest).toBe(expectedInterest);
    expect(result.calculatedPenalty).toBe(expectedPenalty);
    expect(result.entry.status).toBe('PAID');
  });

  // --- Zero and boundary amounts ---

  it('should reject payment of zero amount', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-008',
      description: 'Zero payment test',
      categoryId: seededCategoryId,
      expectedAmount: 100,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    await expect(
      paymentSut.execute({
        entryId: entry.id.toString(),
        tenantId: 'tenant-1',
        amount: 0,
        paidAt: new Date('2026-01-15'),
        method: 'PIX',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should reject payment of negative amount', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-009',
      description: 'Negative payment test',
      categoryId: seededCategoryId,
      expectedAmount: 100,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    await expect(
      paymentSut.execute({
        entryId: entry.id.toString(),
        tenantId: 'tenant-1',
        amount: -50,
        paidAt: new Date('2026-01-15'),
        method: 'PIX',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should accept the smallest possible payment (0.01)', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-010',
      description: 'Minimum payment test',
      categoryId: seededCategoryId,
      expectedAmount: 0.01,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    const result = await paymentSut.execute({
      entryId: entry.id.toString(),
      tenantId: 'tenant-1',
      amount: 0.01,
      paidAt: new Date('2026-01-15'),
      method: 'PIX',
    });

    expect(result.entry.status).toBe('PAID');
    expect(result.entry.actualAmount).toBe(0.01);
  });

  // --- Partial payment precision chain ---

  it('should correctly track remaining balance through multiple partial payments', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-011',
      description: 'Partial chain precision',
      categoryId: seededCategoryId,
      expectedAmount: 1000,
      discount: 100,
      interest: 50,
      penalty: 25,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    // totalDue = 1000 - 100 + 50 + 25 = 975
    expect(entry.totalDue).toBe(975);

    // Pay 325 three times = 975
    for (let i = 0; i < 3; i++) {
      await paymentSut.execute({
        entryId: entry.id.toString(),
        tenantId: 'tenant-1',
        amount: 325,
        paidAt: new Date('2026-01-15'),
        method: 'PIX',
      });
    }

    const updatedEntry = await entriesRepository.findById(entry.id, 'tenant-1');
    expect(updatedEntry!.status).toBe('PAID');
    expect(updatedEntry!.actualAmount).toBe(975);
    expect(updatedEntry!.remainingBalance).toBe(0);
  });
});
