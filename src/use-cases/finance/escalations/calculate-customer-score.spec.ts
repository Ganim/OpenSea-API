import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { CalculateCustomerScoreUseCase } from './calculate-customer-score';

let entriesRepository: InMemoryFinanceEntriesRepository;
let sut: CalculateCustomerScoreUseCase;

const tenantId = 'tenant-1';
const categoryId = new UniqueEntityID().toString();
const costCenterId = new UniqueEntityID().toString();

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

describe('CalculateCustomerScoreUseCase', () => {
  beforeEach(() => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    sut = new CalculateCustomerScoreUseCase(entriesRepository);
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 15, 12, 0, 0));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('should return perfect score for customer with no entries', async () => {
    const result = await sut.execute({
      tenantId,
      customerName: 'Non-Existent Customer',
    });

    expect(result.score).toBe(100);
    expect(result.rating).toBe('EXCELLENT');
    expect(result.totalEntries).toBe(0);
    expect(result.totalValue).toBe(0);
    expect(result.currentOverdueValue).toBe(0);
  });

  it('should return EXCELLENT score for customer who always pays on time', async () => {
    // 3 receivable entries, all paid on time
    for (let i = 0; i < 3; i++) {
      const dueDate = daysAgo(30 + i * 30);
      await entriesRepository.create({
        tenantId,
        type: 'RECEIVABLE',
        code: `REC-${i}`,
        description: `Invoice ${i}`,
        categoryId,
        costCenterId,
        expectedAmount: 1000,
        customerName: 'Good Customer',
        issueDate: daysAgo(60 + i * 30),
        dueDate,
        paymentDate: dueDate, // Paid on due date
        status: 'RECEIVED',
      });
    }

    const result = await sut.execute({
      tenantId,
      customerName: 'Good Customer',
    });

    expect(result.score).toBe(100);
    expect(result.rating).toBe('EXCELLENT');
    expect(result.onTimeRate).toBe(100);
    expect(result.lateRate).toBe(0);
    expect(result.veryLateRate).toBe(0);
    expect(result.totalEntries).toBe(3);
  });

  it('should return POOR score for customer with many very late payments and overdue entries', async () => {
    // Very-late payments dominate value: 95% very-late share + all currently overdue.
    // This is the worst-case: every paid invoice was very late AND there are
    // many overdue entries still open.
    for (let i = 0; i < 5; i++) {
      await entriesRepository.create({
        tenantId,
        type: 'RECEIVABLE',
        code: `REC-VL-${i}`,
        description: `Very Late Invoice ${i}`,
        categoryId,
        costCenterId,
        expectedAmount: 20000,
        customerName: 'Bad Customer',
        issueDate: daysAgo(120 + i * 30),
        dueDate: daysAgo(100 + i * 30),
        paymentDate: daysAgo(55 + i * 30), // 45 days late each
        status: 'RECEIVED',
      });
    }

    // 10 currently overdue entries with very large unpaid value
    for (let i = 0; i < 10; i++) {
      await entriesRepository.create({
        tenantId,
        type: 'RECEIVABLE',
        code: `REC-OVD-${i}`,
        description: `Overdue Invoice ${i}`,
        categoryId,
        costCenterId,
        expectedAmount: 20000,
        customerName: 'Bad Customer',
        issueDate: daysAgo(60),
        dueDate: daysAgo(30 + i * 5),
        status: 'OVERDUE',
      });
    }

    const result = await sut.execute({
      tenantId,
      customerName: 'Bad Customer',
    });

    expect(result.rating).toBe('POOR');
    expect(result.currentOverdue).toBe(10);
    expect(result.currentOverdueValue).toBe(200000);
    expect(result.veryLateRate).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(40);
  });

  it('should throw if customerName is empty', async () => {
    await expect(sut.execute({ tenantId, customerName: '' })).rejects.toThrow(
      'Customer name is required',
    );
  });

  it('should only consider RECEIVABLE entries', async () => {
    // Create a PAYABLE entry (should be ignored)
    await entriesRepository.create({
      tenantId,
      type: 'PAYABLE',
      code: 'PAG-1',
      description: 'Payable',
      categoryId,
      costCenterId,
      expectedAmount: 5000,
      customerName: 'Test Customer',
      issueDate: daysAgo(60),
      dueDate: daysAgo(30),
      status: 'OVERDUE',
    });

    const result = await sut.execute({
      tenantId,
      customerName: 'Test Customer',
    });

    // PAYABLE entries are not considered
    expect(result.totalEntries).toBe(0);
    expect(result.score).toBe(100);
  });

  it('should calculate GOOD rating for mixed payment behavior', async () => {
    // 2 on-time payments
    for (let i = 0; i < 2; i++) {
      const dueDate = daysAgo(60 + i * 30);
      await entriesRepository.create({
        tenantId,
        type: 'RECEIVABLE',
        code: `REC-OT-${i}`,
        description: `On time ${i}`,
        categoryId,
        costCenterId,
        expectedAmount: 1000,
        customerName: 'Mixed Customer',
        issueDate: daysAgo(90 + i * 30),
        dueDate,
        paymentDate: dueDate,
        status: 'RECEIVED',
      });
    }

    // 1 slightly late payment (15 days)
    await entriesRepository.create({
      tenantId,
      type: 'RECEIVABLE',
      code: 'REC-LATE',
      description: 'Late payment',
      categoryId,
      costCenterId,
      expectedAmount: 1000,
      customerName: 'Mixed Customer',
      issueDate: daysAgo(60),
      dueDate: daysAgo(45),
      paymentDate: daysAgo(30), // 15 days late
      status: 'RECEIVED',
    });

    const result = await sut.execute({
      tenantId,
      customerName: 'Mixed Customer',
    });

    expect(result.totalEntries).toBe(3);
    expect(result.onTimeRate).toBeGreaterThan(50);
    expect(result.lateRate).toBeGreaterThan(0);
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.rating).toBe('EXCELLENT'); // 100 - (33*0.3) = ~90
  });

  it('should weight the score by VALUE, not count (P1-21)', async () => {
    // 9 small on-time invoices (R$ 10 each) and 1 huge very-late invoice (R$ 900).
    // By count: 90% on-time → score would be high.
    // By value: on-time share = 90 / (90+900) = ~9%, very-late share = ~91%.
    // Expected: low score, because the big invoice dominates.
    for (let i = 0; i < 9; i++) {
      const dueDate = daysAgo(30 + i);
      await entriesRepository.create({
        tenantId,
        type: 'RECEIVABLE',
        code: `REC-SMALL-${i}`,
        description: `Small on-time ${i}`,
        categoryId,
        costCenterId,
        expectedAmount: 10,
        customerName: 'Big Invoice Customer',
        issueDate: daysAgo(60 + i),
        dueDate,
        paymentDate: dueDate, // on-time
        status: 'RECEIVED',
      });
    }

    // 1 very-late huge invoice (45 days late)
    await entriesRepository.create({
      tenantId,
      type: 'RECEIVABLE',
      code: 'REC-HUGE-VL',
      description: 'Huge very-late invoice',
      categoryId,
      costCenterId,
      expectedAmount: 900,
      customerName: 'Big Invoice Customer',
      issueDate: daysAgo(120),
      dueDate: daysAgo(100),
      paymentDate: daysAgo(55), // 45 days late
      status: 'RECEIVED',
    });

    const result = await sut.execute({
      tenantId,
      customerName: 'Big Invoice Customer',
    });

    // totalValue = 9*10 + 900 = 990. veryLate share = 900/990 ≈ 91%.
    expect(result.totalEntries).toBe(10);
    expect(result.totalValue).toBe(990);
    expect(result.onTimeRate).toBeLessThan(15); // ~9%
    expect(result.veryLateRate).toBeGreaterThan(85); // ~91%
    // Score = 100 - (0*0.3 + 91*0.7 + 0*0.5) ≈ 36 → POOR
    expect(result.score).toBeLessThan(50);
    expect(result.rating).toBe('POOR');
  });

  it('should weight currentOverdueValue by sum of expectedAmount', async () => {
    // Two overdue entries: one big, one tiny.
    await entriesRepository.create({
      tenantId,
      type: 'RECEIVABLE',
      code: 'REC-OVD-BIG',
      description: 'Big overdue',
      categoryId,
      costCenterId,
      expectedAmount: 5000,
      customerName: 'Overdue Value Customer',
      issueDate: daysAgo(60),
      dueDate: daysAgo(30),
      status: 'OVERDUE',
    });

    await entriesRepository.create({
      tenantId,
      type: 'RECEIVABLE',
      code: 'REC-OVD-SMALL',
      description: 'Small overdue',
      categoryId,
      costCenterId,
      expectedAmount: 50,
      customerName: 'Overdue Value Customer',
      issueDate: daysAgo(40),
      dueDate: daysAgo(10),
      status: 'OVERDUE',
    });

    const result = await sut.execute({
      tenantId,
      customerName: 'Overdue Value Customer',
    });

    expect(result.currentOverdue).toBe(2);
    expect(result.currentOverdueValue).toBe(5050);
    expect(result.totalValue).toBe(5050);
  });
});
