import { InMemoryBankAccountsRepository } from '@/repositories/finance/in-memory/in-memory-bank-accounts-repository';
import { InMemoryCashflowSnapshotsRepository } from '@/repositories/finance/in-memory/in-memory-cashflow-snapshots-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CalculateFinancialHealthUseCase } from './calculate-financial-health';

let entriesRepository: InMemoryFinanceEntriesRepository;
let bankAccountsRepository: InMemoryBankAccountsRepository;
let cashflowSnapshotsRepository: InMemoryCashflowSnapshotsRepository;
let sut: CalculateFinancialHealthUseCase;

const TENANT_ID = 'tenant-health-1';

describe('CalculateFinancialHealthUseCase', () => {
  beforeEach(() => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    bankAccountsRepository = new InMemoryBankAccountsRepository();
    cashflowSnapshotsRepository = new InMemoryCashflowSnapshotsRepository();
    sut = new CalculateFinancialHealthUseCase(
      entriesRepository,
      bankAccountsRepository,
      cashflowSnapshotsRepository,
    );
  });

  it('should return a default score with all dimensions when no data exists', async () => {
    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.dimensions).toHaveLength(5);
    expect(result.trend).toBeDefined();
    expect(result.tips).toBeDefined();
    expect(result.tips.length).toBeGreaterThan(0);

    const dimensionNames = result.dimensions.map((d) => d.name);
    expect(dimensionNames).toContain('Liquidez');
    expect(dimensionNames).toContain('Inadimplência');
    expect(dimensionNames).toContain('Previsibilidade');
    expect(dimensionNames).toContain('Diversificação');
    expect(dimensionNames).toContain('Crescimento');

    // Each dimension maxScore should be 20
    for (const dimension of result.dimensions) {
      expect(dimension.maxScore).toBe(20);
      expect(dimension.score).toBeGreaterThanOrEqual(0);
      expect(dimension.score).toBeLessThanOrEqual(20);
    }
  });

  it('should give high liquidity score when cash greatly exceeds payables', async () => {
    // Create a bank account with high balance
    const bankAccount = await bankAccountsRepository.create({
      tenantId: TENANT_ID,
      companyId: 'company-1',
      name: 'Conta Principal',
      bankCode: '001',
      agency: '1234',
      accountNumber: '56789',
      accountType: 'CHECKING',
    });
    bankAccount.currentBalance = 100000;

    // Small payable due in 15 days
    const in15Days = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
    await entriesRepository.create({
      tenantId: TENANT_ID,
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Small payable',
      categoryId: 'cat-1',
      expectedAmount: 5000,
      issueDate: new Date(),
      dueDate: in15Days,
      status: 'PENDING',
    });

    const result = await sut.execute({ tenantId: TENANT_ID });

    const liquidityDimension = result.dimensions.find(
      (d) => d.name === 'Liquidez',
    );
    expect(liquidityDimension).toBeDefined();
    expect(liquidityDimension!.score).toBe(20); // ratio >> 2.0
  });

  it('should give low delinquency score when most entries are overdue', async () => {
    const pastDate = new Date('2025-01-01');

    // Create several overdue entries
    for (let i = 0; i < 8; i++) {
      await entriesRepository.create({
        tenantId: TENANT_ID,
        type: 'RECEIVABLE',
        code: `REC-OVERDUE-${i}`,
        description: `Overdue receivable ${i}`,
        categoryId: 'cat-1',
        expectedAmount: 1000,
        issueDate: new Date('2024-12-01'),
        dueDate: pastDate,
        status: 'OVERDUE',
      });
    }

    // Create 2 pending non-overdue entries (due in future)
    const futureDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    for (let i = 0; i < 2; i++) {
      await entriesRepository.create({
        tenantId: TENANT_ID,
        type: 'RECEIVABLE',
        code: `REC-PENDING-${i}`,
        description: `Pending receivable ${i}`,
        categoryId: 'cat-1',
        expectedAmount: 1000,
        issueDate: new Date(),
        dueDate: futureDate,
        status: 'PENDING',
      });
    }

    const result = await sut.execute({ tenantId: TENANT_ID });

    const delinquencyDimension = result.dimensions.find(
      (d) => d.name === 'Inadimplência',
    );
    expect(delinquencyDimension).toBeDefined();
    // 8 overdue out of 10 total = 80% delinquency rate → score 0
    expect(delinquencyDimension!.score).toBe(0);

    // Should have a tip about delinquency
    expect(
      result.tips.some((t) => t.toLowerCase().includes('inadimplência')),
    ).toBe(true);
  });

  it('should give default predictability score when no cashflow snapshots exist', async () => {
    const result = await sut.execute({ tenantId: TENANT_ID });

    const predictabilityDimension = result.dimensions.find(
      (d) => d.name === 'Previsibilidade',
    );
    expect(predictabilityDimension).toBeDefined();
    expect(predictabilityDimension!.score).toBe(10); // default when no data
  });

  it('should give high predictability score when cashflow snapshots are accurate', async () => {
    // Create accurate snapshots within the last 30 days
    for (let dayOffset = 5; dayOffset <= 25; dayOffset += 5) {
      const snapshotDate = new Date(
        Date.now() - dayOffset * 24 * 60 * 60 * 1000,
      );
      await cashflowSnapshotsRepository.upsert({
        tenantId: TENANT_ID,
        date: snapshotDate,
        predictedInflow: 10000,
        predictedOutflow: 5000,
        actualInflow: 10200, // very close to predicted
        actualOutflow: 4900,
      });
    }

    const result = await sut.execute({ tenantId: TENANT_ID });

    const predictabilityDimension = result.dimensions.find(
      (d) => d.name === 'Previsibilidade',
    );
    expect(predictabilityDimension).toBeDefined();
    expect(predictabilityDimension!.score).toBeGreaterThanOrEqual(16);
  });

  it('should calculate diversification based on supplier concentration', async () => {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    // Create paid entries for one dominant supplier
    for (let i = 0; i < 5; i++) {
      await entriesRepository.create({
        tenantId: TENANT_ID,
        type: 'PAYABLE',
        code: `PAG-DOMINANT-${i}`,
        description: `Payment to dominant supplier ${i}`,
        categoryId: 'cat-1',
        expectedAmount: 10000,
        actualAmount: 10000,
        issueDate: ninetyDaysAgo,
        dueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        status: 'PAID',
        supplierName: 'Fornecedor Dominante',
      });
    }

    // Create one small payment to another supplier
    await entriesRepository.create({
      tenantId: TENANT_ID,
      type: 'PAYABLE',
      code: 'PAG-SMALL-1',
      description: 'Small payment',
      categoryId: 'cat-1',
      expectedAmount: 1000,
      actualAmount: 1000,
      issueDate: ninetyDaysAgo,
      dueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      status: 'PAID',
      supplierName: 'Fornecedor Pequeno',
    });

    const result = await sut.execute({ tenantId: TENANT_ID });

    const diversificationDimension = result.dimensions.find(
      (d) => d.name === 'Diversificação',
    );
    expect(diversificationDimension).toBeDefined();
    // 50000 / 51000 = ~98% concentration → score 0
    expect(diversificationDimension!.score).toBe(0);

    // Should have a tip about diversification
    expect(
      result.tips.some((t) => t.toLowerCase().includes('fornecedores')),
    ).toBe(true);
  });

  it('should determine trend based on growth and liquidity', async () => {
    // Setup a positive scenario - good liquidity and growth
    const bankAccount = await bankAccountsRepository.create({
      tenantId: TENANT_ID,
      companyId: 'company-1',
      name: 'Main Account',
      bankCode: '001',
      agency: '1234',
      accountNumber: '99999',
      accountType: 'CHECKING',
    });
    bankAccount.currentBalance = 50000;

    const now = new Date();
    const startOfThisMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const startOfLastMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
    );

    // Revenue this month (higher)
    await entriesRepository.create({
      tenantId: TENANT_ID,
      type: 'RECEIVABLE',
      code: 'REC-THIS-MONTH',
      description: 'Revenue this month',
      categoryId: 'cat-1',
      expectedAmount: 20000,
      issueDate: startOfThisMonth,
      dueDate: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 15)),
      status: 'PENDING',
    });

    // Revenue last month (lower)
    await entriesRepository.create({
      tenantId: TENANT_ID,
      type: 'RECEIVABLE',
      code: 'REC-LAST-MONTH',
      description: 'Revenue last month',
      categoryId: 'cat-1',
      expectedAmount: 10000,
      issueDate: startOfLastMonth,
      dueDate: new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 15),
      ),
      status: 'RECEIVED',
    });

    const result = await sut.execute({ tenantId: TENANT_ID });

    // Growth > 10% and liquidity high → trend should be UP
    expect(result.trend).toBe('UP');
  });

  it('should compute total score as sum of all dimension scores', async () => {
    const result = await sut.execute({ tenantId: TENANT_ID });

    const sumOfDimensions = result.dimensions.reduce(
      (sum, d) => sum + d.score,
      0,
    );
    expect(result.score).toBe(sumOfDimensions);
  });
});
