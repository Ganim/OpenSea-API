import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mock Prisma ─────────────────────────────────────────────────────────────

vi.mock('@/lib/prisma', () => ({
  prisma: {
    financeEntry: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { SuggestPaymentTimingUseCase } from './suggest-payment-timing';

const mockPrisma = prisma as unknown as {
  financeEntry: { findMany: ReturnType<typeof vi.fn> };
};

let sut: SuggestPaymentTimingUseCase;

const TENANT_ID = 'tenant-1';

function makeEntry(overrides = {}) {
  const now = new Date();
  const dueDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days from now

  return {
    id: 'entry-1',
    tenantId: TENANT_ID,
    type: 'PAYABLE',
    code: 'PAG-001',
    expectedAmount: 10000,
    discount: 0,
    interest: 0,
    penalty: 0,
    supplierName: 'Fornecedor XPTO',
    dueDate,
    status: 'PENDING',
    deletedAt: null,
    ...overrides,
  };
}

describe('SuggestPaymentTimingUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sut = new SuggestPaymentTimingUseCase();
  });

  it('should suggest early payment when discount is available', async () => {
    mockPrisma.financeEntry.findMany.mockResolvedValue([
      makeEntry({
        discount: 200, // R$ 200 discount
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      }),
    ]);

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.suggestions).toHaveLength(1);
    expect(result.suggestions[0].type).toBe('EARLY_DISCOUNT');
    expect(result.suggestions[0].savingsAmount).toBeGreaterThan(0);
    expect(result.suggestions[0].reason).toContain('economize');
  });

  it('should suggest safe delay when no penalties exist', async () => {
    mockPrisma.financeEntry.findMany.mockResolvedValue([
      makeEntry({
        discount: 0,
        interest: 0,
        penalty: 0,
        expectedAmount: 50000,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      }),
    ]);

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.suggestions).toHaveLength(1);
    expect(result.suggestions[0].type).toBe('DELAY_SAFE');
    expect(result.suggestions[0].priority).toBe('LOW');
    expect(result.suggestions[0].reason).toContain('postergar');
  });

  it('should prioritize penalty risk entries', async () => {
    const now = new Date();
    mockPrisma.financeEntry.findMany.mockResolvedValue([
      makeEntry({
        id: 'entry-overdue',
        penalty: 150,
        interest: 2,
        dueDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days overdue
        status: 'OVERDUE',
      }),
    ]);

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.suggestions).toHaveLength(1);
    expect(result.suggestions[0].type).toBe('PENALTY_RISK');
    expect(result.suggestions[0].priority).toBe('HIGH');
    expect(result.suggestions[0].reason).toContain('Priorize');
    expect(result.suggestions[0].reason).toContain('multa/juros');
  });

  it('should return no suggestions when all entries are optimal', async () => {
    // Entry that is far in the future with no discount/penalty — no actionable suggestion
    mockPrisma.financeEntry.findMany.mockResolvedValue([
      makeEntry({
        dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        expectedAmount: 100, // small amount — opportunity cost < 1
        discount: 0,
        interest: 0,
        penalty: 0,
      }),
    ]);

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.suggestions).toHaveLength(0);
    expect(result.totalPotentialSavings).toBe(0);
    expect(result.analyzedEntries).toBe(1);
  });

  it('should calculate total potential savings across all suggestions', async () => {
    const now = new Date();
    mockPrisma.financeEntry.findMany.mockResolvedValue([
      makeEntry({
        id: 'entry-1',
        discount: 300,
        dueDate: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
      }),
      makeEntry({
        id: 'entry-2',
        penalty: 200,
        interest: 1,
        dueDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        status: 'OVERDUE',
      }),
    ]);

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.suggestions.length).toBeGreaterThanOrEqual(2);
    expect(result.totalPotentialSavings).toBeGreaterThan(0);
    // HIGH priority should come first
    expect(result.suggestions[0].priority).toBe('HIGH');
  });
});
