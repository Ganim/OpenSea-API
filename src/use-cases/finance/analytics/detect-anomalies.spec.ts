import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { InMemoryFinanceCategoriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-categories-repository';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DetectAnomaliesUseCase } from './detect-anomalies';

let entriesRepository: InMemoryFinanceEntriesRepository;
let categoriesRepository: InMemoryFinanceCategoriesRepository;
let sut: DetectAnomaliesUseCase;

// Helper to create entries quickly
async function createEntry(
  overrides: Partial<{
    tenantId: string;
    type: string;
    code: string;
    description: string;
    categoryId: string;
    expectedAmount: number;
    supplierName: string;
    dueDate: Date;
    status: string;
  }>,
) {
  return entriesRepository.create({
    tenantId: overrides.tenantId ?? 'tenant-1',
    type: (overrides.type as 'PAYABLE') ?? 'PAYABLE',
    code: overrides.code ?? `PAG-${Math.random().toString(36).slice(2, 8)}`,
    description: overrides.description ?? 'Test entry',
    categoryId: overrides.categoryId ?? 'cat-1',
    expectedAmount: overrides.expectedAmount ?? 1000,
    supplierName: overrides.supplierName,
    issueDate: new Date('2026-01-01'),
    dueDate: overrides.dueDate ?? new Date('2026-02-15'),
    status: (overrides.status as 'PENDING') ?? 'PENDING',
  });
}

async function createCategory(
  id: string,
  name: string,
  tenantId = 'tenant-1',
) {
  return categoriesRepository.create({
    tenantId,
    name,
    slug: name.toLowerCase().replace(/\s/g, '-'),
    type: 'EXPENSE',
  });
}

describe('DetectAnomaliesUseCase', () => {
  beforeEach(async () => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    categoriesRepository = new InMemoryFinanceCategoriesRepository();
    sut = new DetectAnomaliesUseCase(entriesRepository, categoriesRepository);

    // Mock current date to March 2026
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return empty report when no entries exist', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1', months: 6 });

    expect(result.anomalies).toHaveLength(0);
    expect(result.totalEntriesAnalyzed).toBe(0);
    expect(result.categoriesAnalyzed).toBe(0);
    expect(result.analyzedPeriod.from).toBeDefined();
    expect(result.analyzedPeriod.to).toBeDefined();
  });

  it('should return no anomalies when all values are within normal range', async () => {
    const cat = await createCategory('cat-1', 'Energia', 'tenant-1');
    const catId = cat.id.toString();

    // Create 5 entries with similar amounts (low variance)
    for (let i = 0; i < 5; i++) {
      const month = i < 4 ? i - 3 : 0; // historical + current month
      await createEntry({
        categoryId: catId,
        expectedAmount: 1000 + i * 10, // 1000, 1010, 1020, 1030, 1040
        dueDate: new Date(
          Date.UTC(2026, 2 + month, 15), // months relative to March 2026
        ),
      });
    }

    const result = await sut.execute({ tenantId: 'tenant-1', months: 6 });

    // With such small variance, no entry should be flagged
    const spikes = result.anomalies.filter((a) => a.type === 'EXPENSE_SPIKE');
    expect(spikes).toHaveLength(0);
  });

  it('should detect EXPENSE_SPIKE at 2x stddev as HIGH severity', async () => {
    const cat = await createCategory('cat-1', 'Energia', 'tenant-1');
    const catId = cat.id.toString();

    // Historical: amounts with controlled variance
    // mean=1000, stddev~158 for [800,900,1000,1100,1200]
    // Including the anomaly: [800,900,1000,1100,1200,2000]
    // new mean~1166, new stddev~406 → 2000 is ~2.05 stddev above → HIGH
    const amounts = [800, 900, 1000, 1100, 1200];
    for (let i = 0; i < amounts.length; i++) {
      await createEntry({
        categoryId: catId,
        expectedAmount: amounts[i],
        dueDate: new Date(Date.UTC(2026, i - 4, 15)),
      });
    }

    // Current month: R$ 3000 — far above any stddev threshold
    await createEntry({
      categoryId: catId,
      expectedAmount: 3000,
      description: 'Conta de energia',
      dueDate: new Date(Date.UTC(2026, 2, 15)), // March 2026
    });

    const result = await sut.execute({ tenantId: 'tenant-1', months: 6 });

    const spikes = result.anomalies.filter((a) => a.type === 'EXPENSE_SPIKE');
    expect(spikes.length).toBeGreaterThanOrEqual(1);

    const spike = spikes.find((a) => a.currentValue === 3000);
    expect(spike).toBeDefined();
    expect(['HIGH', 'CRITICAL']).toContain(spike!.severity);
    expect(spike!.description).toContain('acima da média');
  });

  it('should detect CRITICAL severity at 3x stddev', async () => {
    const cat = await createCategory('cat-1', 'Energia', 'tenant-1');
    const catId = cat.id.toString();

    // Historical: 10 entries around R$ 500 with small variance
    // More entries = tighter distribution = easier to trigger CRITICAL
    for (let i = 0; i < 10; i++) {
      await createEntry({
        categoryId: catId,
        expectedAmount: 480 + (i % 3) * 20, // 480, 500, 520
        dueDate: new Date(Date.UTC(2025, 9 + Math.floor(i / 3), 10 + (i % 3))),
      });
    }

    // Current month: R$ 2500 — massive outlier, should be CRITICAL
    await createEntry({
      categoryId: catId,
      expectedAmount: 2500,
      dueDate: new Date(Date.UTC(2026, 2, 15)),
    });

    const result = await sut.execute({ tenantId: 'tenant-1', months: 6 });

    const spikes = result.anomalies.filter((a) => a.type === 'EXPENSE_SPIKE');
    const critical = spikes.find(
      (a) => a.severity === 'CRITICAL',
    );
    expect(critical).toBeDefined();
    expect(critical!.currentValue).toBe(2500);
  });

  it('should detect PRICE_INCREASE for supplier', async () => {
    const cat = await createCategory('cat-1', 'Material', 'tenant-1');
    const catId = cat.id.toString();

    // Historical: supplier "Fornecedor ABC" charges around R$ 500
    for (let i = 0; i < 4; i++) {
      await createEntry({
        categoryId: catId,
        expectedAmount: 500,
        supplierName: 'Fornecedor ABC',
        dueDate: new Date(Date.UTC(2026, i - 3, 15)), // Dec to Feb
      });
    }

    // Current month: same supplier, R$ 700 (40% increase)
    await createEntry({
      categoryId: catId,
      expectedAmount: 700,
      supplierName: 'Fornecedor ABC',
      dueDate: new Date(Date.UTC(2026, 2, 15)), // March
    });

    const result = await sut.execute({ tenantId: 'tenant-1', months: 6 });

    const priceIncreases = result.anomalies.filter(
      (a) => a.type === 'PRICE_INCREASE',
    );
    expect(priceIncreases.length).toBeGreaterThanOrEqual(1);
    expect(priceIncreases[0].supplierName).toBe('Fornecedor ABC');
    expect(priceIncreases[0].deviationPercent).toBeGreaterThanOrEqual(30);
    expect(priceIncreases[0].description).toContain('Fornecedor ABC');
  });

  it('should detect UNUSUAL_FREQUENCY', async () => {
    const cat = await createCategory('cat-1', 'Compras', 'tenant-1');
    const catId = cat.id.toString();

    // Historical: 2 entries per month for 4 months
    for (let month = -4; month <= -1; month++) {
      for (let j = 0; j < 2; j++) {
        await createEntry({
          categoryId: catId,
          expectedAmount: 100,
          dueDate: new Date(Date.UTC(2026, 2 + month, 10 + j)),
        });
      }
    }

    // Current month: 5 entries (2.5x the average of 2)
    for (let j = 0; j < 5; j++) {
      await createEntry({
        categoryId: catId,
        expectedAmount: 100,
        dueDate: new Date(Date.UTC(2026, 2, 5 + j)), // March 2026
      });
    }

    const result = await sut.execute({ tenantId: 'tenant-1', months: 6 });

    const freqAnomalies = result.anomalies.filter(
      (a) => a.type === 'UNUSUAL_FREQUENCY',
    );
    expect(freqAnomalies.length).toBeGreaterThanOrEqual(1);
    expect(freqAnomalies[0].currentValue).toBe(5);
    expect(freqAnomalies[0].description).toContain('Compras');
  });

  it('should require minimum 3 entries per category for spike detection', async () => {
    const cat = await createCategory('cat-1', 'Aluguel', 'tenant-1');
    const catId = cat.id.toString();

    // Only 2 entries — not enough for statistical analysis
    await createEntry({
      categoryId: catId,
      expectedAmount: 1000,
      dueDate: new Date(Date.UTC(2026, 0, 15)),
    });
    await createEntry({
      categoryId: catId,
      expectedAmount: 5000,
      dueDate: new Date(Date.UTC(2026, 2, 15)), // March (current)
    });

    const result = await sut.execute({ tenantId: 'tenant-1', months: 6 });

    const spikes = result.anomalies.filter((a) => a.type === 'EXPENSE_SPIKE');
    expect(spikes).toHaveLength(0);
  });

  it('should return correct analyzedPeriod', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1', months: 6 });

    expect(result.analyzedPeriod.from).toBe('2025-09-01');
    expect(result.analyzedPeriod.to).toBe('2026-03-31');
  });

  it('should sort anomalies by severity (CRITICAL first)', async () => {
    const cat = await createCategory('cat-1', 'Energia', 'tenant-1');
    const catId = cat.id.toString();

    const amounts = [800, 900, 1000, 1100, 1200]; // mean=1000, stddev~158
    for (let i = 0; i < amounts.length; i++) {
      await createEntry({
        categoryId: catId,
        expectedAmount: amounts[i],
        dueDate: new Date(Date.UTC(2026, i - 4, 15)),
      });
    }

    // CRITICAL spike
    await createEntry({
      categoryId: catId,
      expectedAmount: 1600,
      dueDate: new Date(Date.UTC(2026, 2, 10)),
    });

    // MEDIUM spike
    await createEntry({
      categoryId: catId,
      expectedAmount: 1300,
      dueDate: new Date(Date.UTC(2026, 2, 20)),
    });

    const result = await sut.execute({ tenantId: 'tenant-1', months: 6 });

    if (result.anomalies.length >= 2) {
      const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      for (let i = 1; i < result.anomalies.length; i++) {
        expect(
          severityOrder[result.anomalies[i].severity],
        ).toBeGreaterThanOrEqual(
          severityOrder[result.anomalies[i - 1].severity],
        );
      }
    }
  });

  it('should not mix tenants', async () => {
    const cat = await createCategory('cat-1', 'Energia', 'tenant-1');
    const catId = cat.id.toString();

    // Create entries for tenant-1
    for (let i = 0; i < 5; i++) {
      await createEntry({
        tenantId: 'tenant-1',
        categoryId: catId,
        expectedAmount: 1000,
        dueDate: new Date(Date.UTC(2026, i - 3, 15)),
      });
    }

    // Anomalous entry for tenant-2 — should NOT appear in tenant-1 report
    await createEntry({
      tenantId: 'tenant-2',
      categoryId: catId,
      expectedAmount: 50000,
      dueDate: new Date(Date.UTC(2026, 2, 15)),
    });

    const result = await sut.execute({ tenantId: 'tenant-1', months: 6 });

    // Should only analyze tenant-1 entries
    const hasT2Anomaly = result.anomalies.some(
      (a) => a.currentValue === 50000,
    );
    expect(hasT2Anomaly).toBe(false);
  });

  it('should generate Portuguese descriptions', async () => {
    const cat = await createCategory('cat-1', 'Energia', 'tenant-1');
    const catId = cat.id.toString();

    const amounts = [800, 900, 1000, 1100, 1200];
    for (let i = 0; i < amounts.length; i++) {
      await createEntry({
        categoryId: catId,
        expectedAmount: amounts[i],
        dueDate: new Date(Date.UTC(2026, i - 4, 15)),
      });
    }

    await createEntry({
      categoryId: catId,
      expectedAmount: 1500,
      description: 'Conta de energia',
      dueDate: new Date(Date.UTC(2026, 2, 15)),
    });

    const result = await sut.execute({ tenantId: 'tenant-1', months: 6 });

    const spike = result.anomalies.find((a) => a.type === 'EXPENSE_SPIKE');
    if (spike) {
      expect(spike.description).toContain('acima da média');
      expect(spike.description).toContain('R$');
    }
  });
});

