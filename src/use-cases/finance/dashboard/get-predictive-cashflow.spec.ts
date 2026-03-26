import { InMemoryBankAccountsRepository } from '@/repositories/finance/in-memory/in-memory-bank-accounts-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetPredictiveCashflowUseCase } from './get-predictive-cashflow';

let entriesRepository: InMemoryFinanceEntriesRepository;
let bankAccountsRepository: InMemoryBankAccountsRepository;
let sut: GetPredictiveCashflowUseCase;

// Fixed date for deterministic tests: 2026-03-15
const FIXED_NOW = new Date('2026-03-15T12:00:00Z');

describe('GetPredictiveCashflowUseCase', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);

    entriesRepository = new InMemoryFinanceEntriesRepository();
    bankAccountsRepository = new InMemoryBankAccountsRepository();
    sut = new GetPredictiveCashflowUseCase(
      entriesRepository,
      bankAccountsRepository,
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function seedBankAccount(balance: number) {
    await bankAccountsRepository.create({
      tenantId: 'tenant-1',
      name: 'Conta Principal',
      bankCode: '001',
      agency: '1234',
      accountNumber: '12345',
      accountType: 'CHECKING',
    });
    // Set balance directly
    bankAccountsRepository.items[0].currentBalance = balance;
  }

  async function seedMonthlyData(
    months: number,
    revenuePerMonth: number,
    expensePerMonth: number,
  ) {
    for (let i = months; i >= 1; i--) {
      const date = new Date(
        Date.UTC(
          FIXED_NOW.getUTCFullYear(),
          FIXED_NOW.getUTCMonth() - i,
          15,
        ),
      );

      await entriesRepository.create({
        tenantId: 'tenant-1',
        type: 'RECEIVABLE',
        code: `REC-H${i}`,
        description: `Revenue month -${i}`,
        categoryId: 'cat-1',
        expectedAmount: revenuePerMonth,
        issueDate: date,
        dueDate: date,
      });

      await entriesRepository.create({
        tenantId: 'tenant-1',
        type: 'PAYABLE',
        code: `PAG-H${i}`,
        description: `Expense month -${i}`,
        categoryId: 'cat-1',
        expectedAmount: expensePerMonth,
        issueDate: date,
        dueDate: date,
      });
    }
  }

  it('should project flat data with constant revenue and expenses', async () => {
    await seedBankAccount(50000);
    await seedMonthlyData(6, 10000, 8000);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      months: 3,
    });

    expect(result.currentBalance).toBe(50000);
    expect(result.projectedMonths).toHaveLength(3);
    expect(result.dataQuality).toBe('HIGH'); // 6 months of data

    // With flat data, each month should show positive net flow
    for (const month of result.projectedMonths) {
      expect(month.projectedRevenue).toBeGreaterThan(0);
      expect(month.projectedExpenses).toBeGreaterThan(0);
      expect(month.projectedRevenue).toBeGreaterThan(
        month.projectedExpenses * 0.5,
      );
    }

    // Balance should be increasing (revenue > expenses)
    expect(
      result.projectedMonths[result.projectedMonths.length - 1]
        .projectedBalance,
    ).toBeGreaterThan(result.currentBalance);
  });

  it('should apply seasonal adjustment based on historical data', async () => {
    await seedBankAccount(50000);

    // Create entries with varying amounts to create seasonality
    // Large revenue in months that match future projection targets
    for (let i = 12; i >= 1; i--) {
      const date = new Date(
        Date.UTC(
          FIXED_NOW.getUTCFullYear(),
          FIXED_NOW.getUTCMonth() - i,
          15,
        ),
      );

      // Make some months have 2x revenue to create seasonal variance
      const multiplier = i <= 3 ? 2.0 : 1.0;

      await entriesRepository.create({
        tenantId: 'tenant-1',
        type: 'RECEIVABLE',
        code: `REC-S${i}`,
        description: `Seasonal revenue -${i}`,
        categoryId: 'cat-1',
        expectedAmount: 10000 * multiplier,
        issueDate: date,
        dueDate: date,
      });

      await entriesRepository.create({
        tenantId: 'tenant-1',
        type: 'PAYABLE',
        code: `PAG-S${i}`,
        description: `Seasonal expense -${i}`,
        categoryId: 'cat-1',
        expectedAmount: 5000,
        issueDate: date,
        dueDate: date,
      });
    }

    const result = await sut.execute({
      tenantId: 'tenant-1',
      months: 3,
    });

    // With seasonal variation, seasonal indices should not all be 1.0
    const hasVariation = result.projectedMonths.some(
      (m) => m.seasonalIndex !== 1.0,
    );
    expect(hasVariation).toBe(true);
    expect(result.dataQuality).toBe('HIGH');
  });

  it('should detect danger zones when expenses exceed revenue', async () => {
    await seedBankAccount(5000); // Low starting balance
    await seedMonthlyData(6, 3000, 8000); // Expenses > Revenue

    const result = await sut.execute({
      tenantId: 'tenant-1',
      months: 3,
    });

    // With low balance and expenses > revenue, should find danger zones
    expect(result.dangerZones.length).toBeGreaterThan(0);

    // Danger zones should have negative projected balance
    for (const dz of result.dangerZones) {
      expect(dz.projectedBalance).toBeLessThan(0);
      expect(dz.deficit).toBeGreaterThan(0);
      expect(dz.suggestion).toContain('déficit');
    }
  });

  it('should generate suggestions for deficit scenarios', async () => {
    await seedBankAccount(2000);
    await seedMonthlyData(6, 3000, 7000);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      months: 3,
    });

    expect(result.suggestions.length).toBeGreaterThan(0);

    // Should have at least one suggestion about negative balance or expense reduction
    const hasActionableSuggestion = result.suggestions.some(
      (s) =>
        s.includes('déficit') ||
        s.includes('despesas') ||
        s.includes('negativo') ||
        s.includes('redução'),
    );
    expect(hasActionableSuggestion).toBe(true);
  });

  it('should report LOW data quality when less than 3 months of history', async () => {
    await seedBankAccount(50000);
    await seedMonthlyData(2, 10000, 8000);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      months: 3,
    });

    expect(result.dataQuality).toBe('LOW');

    // Confidence should be low
    for (const month of result.projectedMonths) {
      expect(month.confidence).toBeLessThanOrEqual(0.35);
    }
  });

  it('should give recent months more weight in weighted average', async () => {
    await seedBankAccount(50000);

    // Old months: low revenue (months 12-4 ago)
    for (let i = 12; i >= 4; i--) {
      const date = new Date(
        Date.UTC(
          FIXED_NOW.getUTCFullYear(),
          FIXED_NOW.getUTCMonth() - i,
          15,
        ),
      );
      await entriesRepository.create({
        tenantId: 'tenant-1',
        type: 'RECEIVABLE',
        code: `REC-OLD${i}`,
        description: `Old revenue`,
        categoryId: 'cat-1',
        expectedAmount: 1000,
        issueDate: date,
        dueDate: date,
      });
    }

    // Recent months: high revenue (months 3-1 ago)
    for (let i = 3; i >= 1; i--) {
      const date = new Date(
        Date.UTC(
          FIXED_NOW.getUTCFullYear(),
          FIXED_NOW.getUTCMonth() - i,
          15,
        ),
      );
      await entriesRepository.create({
        tenantId: 'tenant-1',
        type: 'RECEIVABLE',
        code: `REC-NEW${i}`,
        description: `Recent revenue`,
        categoryId: 'cat-1',
        expectedAmount: 10000,
        issueDate: date,
        dueDate: date,
      });
    }

    // Also run with only old data to compare
    const entriesRepoOldOnly = new InMemoryFinanceEntriesRepository();
    for (let i = 12; i >= 4; i--) {
      const date = new Date(
        Date.UTC(
          FIXED_NOW.getUTCFullYear(),
          FIXED_NOW.getUTCMonth() - i,
          15,
        ),
      );
      await entriesRepoOldOnly.create({
        tenantId: 'tenant-1',
        type: 'RECEIVABLE',
        code: `REC-OLD${i}`,
        description: `Old revenue`,
        categoryId: 'cat-1',
        expectedAmount: 1000,
        issueDate: date,
        dueDate: date,
      });
    }

    const sutOldOnly = new GetPredictiveCashflowUseCase(
      entriesRepoOldOnly,
      bankAccountsRepository,
    );

    const resultMixed = await sut.execute({
      tenantId: 'tenant-1',
      months: 1,
    });

    const resultOldOnly = await sutOldOnly.execute({
      tenantId: 'tenant-1',
      months: 1,
    });

    // Mixed (old low + recent high) should project MORE revenue
    // than old-only data, proving recent months get more weight
    const projectedRevMixed = resultMixed.projectedMonths[0].projectedRevenue;
    const projectedRevOldOnly = resultOldOnly.projectedMonths[0].projectedRevenue;
    expect(projectedRevMixed).toBeGreaterThan(projectedRevOldOnly);
  });

  it('should generate daily projections for the entire forecast period', async () => {
    await seedBankAccount(50000);
    await seedMonthlyData(6, 10000, 8000);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      months: 2,
    });

    // Daily projection should cover all days in the 2 projected months
    expect(result.dailyProjection.length).toBeGreaterThan(28); // at least one month
    expect(result.dailyProjection.length).toBeLessThanOrEqual(62); // max 2 months

    // Each daily projection should have a date and balance
    for (const dp of result.dailyProjection) {
      expect(dp.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(typeof dp.balance).toBe('number');
      expect(dp.isNegative).toBe(dp.balance < 0);
    }
  });

  it('should generate surplus suggestion when balance grows significantly', async () => {
    await seedBankAccount(100000);
    await seedMonthlyData(6, 30000, 5000); // Very high revenue vs expenses

    const result = await sut.execute({
      tenantId: 'tenant-1',
      months: 3,
    });

    const hasSurplusSuggestion = result.suggestions.some(
      (s) => s.includes('investimento') || s.includes('investimentos'),
    );
    expect(hasSurplusSuggestion).toBe(true);
  });
});
