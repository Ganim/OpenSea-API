import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mock Prisma ─────────────────────────────────────────────────────────────

vi.mock('@/lib/prisma', () => ({
  prisma: {
    financeEntry: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    fiscalDocument: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    itemMovement: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { ThreeWayMatchUseCase } from './three-way-match';

const mockPrisma = prisma as unknown as {
  financeEntry: {
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  fiscalDocument: {
    findUnique: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
  };
  itemMovement: { findMany: ReturnType<typeof vi.fn> };
};

let sut: ThreeWayMatchUseCase;

const TENANT_ID = 'tenant-1';
const ENTRY_ID = 'entry-1';

function makeEntry(overrides = {}) {
  return {
    id: ENTRY_ID,
    tenantId: TENANT_ID,
    type: 'PAYABLE',
    code: 'PAG-001',
    expectedAmount: 5000,
    supplierName: 'Fornecedor XPTO',
    fiscalDocumentId: null,
    issueDate: new Date('2026-03-01'),
    dueDate: new Date('2026-03-30'),
    deletedAt: null,
    ...overrides,
  };
}

function makeFiscalDocument(overrides = {}) {
  return {
    id: 'doc-1',
    tenantId: TENANT_ID,
    series: 1,
    number: 123,
    totalValue: 5000,
    recipientName: 'Fornecedor XPTO',
    status: 'AUTHORIZED',
    createdAt: new Date('2026-03-15'),
    ...overrides,
  };
}

function makeMovement(overrides = {}) {
  return {
    id: 'mov-1',
    tenantId: TENANT_ID,
    movementType: 'PURCHASE',
    quantity: 10,
    notes: 'Fornecedor XPTO',
    originRef: null,
    destinationRef: null,
    createdAt: new Date('2026-03-16'),
    ...overrides,
  };
}

describe('ThreeWayMatchUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.financeEntry.update.mockResolvedValue({});
    sut = new ThreeWayMatchUseCase();
  });

  it('should return FULL_MATCH when all three documents are found', async () => {
    const entry = makeEntry({ fiscalDocumentId: 'doc-1' });
    mockPrisma.financeEntry.findFirst.mockResolvedValue(entry);
    mockPrisma.fiscalDocument.findUnique.mockResolvedValue(
      makeFiscalDocument(),
    );
    mockPrisma.financeEntry.findMany.mockResolvedValue([
      makeEntry({ id: 'entry-2', code: 'PAG-002' }),
    ]);
    mockPrisma.itemMovement.findMany.mockResolvedValue([makeMovement()]);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      entryId: ENTRY_ID,
    });

    expect(result.matchStatus).toBe('FULL_MATCH');
    expect(result.invoice).toBeDefined();
    expect(result.purchaseOrder).toBeDefined();
    expect(result.goodsReceipt).toBeDefined();
    expect(result.discrepancies).toHaveLength(0);
    expect(result.recommendation).toContain('aprovado automaticamente');
  });

  it('should return PARTIAL_MATCH when goods receipt is missing', async () => {
    const entry = makeEntry({ fiscalDocumentId: 'doc-1' });
    mockPrisma.financeEntry.findFirst.mockResolvedValue(entry);
    mockPrisma.fiscalDocument.findUnique.mockResolvedValue(
      makeFiscalDocument(),
    );
    mockPrisma.financeEntry.findMany.mockResolvedValue([
      makeEntry({ id: 'entry-2', code: 'PAG-002' }),
    ]);
    mockPrisma.itemMovement.findMany.mockResolvedValue([]);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      entryId: ENTRY_ID,
    });

    expect(result.matchStatus).toBe('PARTIAL_MATCH');
    expect(result.invoice).toBeDefined();
    expect(result.purchaseOrder).toBeDefined();
    expect(result.goodsReceipt).toBeUndefined();
    expect(result.recommendation).toContain('recebimento de mercadoria');
  });

  it('should return NO_MATCH when only the entry exists', async () => {
    const entry = makeEntry({ supplierName: null });
    mockPrisma.financeEntry.findFirst.mockResolvedValue(entry);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      entryId: ENTRY_ID,
    });

    expect(result.matchStatus).toBe('NO_MATCH');
    expect(result.invoice).toBeUndefined();
    expect(result.purchaseOrder).toBeUndefined();
    expect(result.goodsReceipt).toBeUndefined();
    expect(result.recommendation).toContain('aprovação manual');
  });

  it('should flag amount discrepancy when invoice amount differs', async () => {
    const entry = makeEntry({ fiscalDocumentId: 'doc-1' });
    mockPrisma.financeEntry.findFirst.mockResolvedValue(entry);
    mockPrisma.fiscalDocument.findUnique.mockResolvedValue(
      makeFiscalDocument({ totalValue: 5500 }), // 10% off
    );
    mockPrisma.financeEntry.findMany.mockResolvedValue([
      makeEntry({ id: 'entry-2', code: 'PAG-002' }),
    ]);
    mockPrisma.itemMovement.findMany.mockResolvedValue([makeMovement()]);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      entryId: ENTRY_ID,
    });

    expect(result.matchStatus).toBe('PARTIAL_MATCH');
    expect(result.discrepancies).toHaveLength(1);
    expect(result.discrepancies[0].field).toBe('amount');
    expect(result.discrepancies[0].expected).toContain('5000.00');
    expect(result.discrepancies[0].actual).toContain('5500.00');
  });

  it('should throw when entry is not found', async () => {
    mockPrisma.financeEntry.findFirst.mockResolvedValue(null);

    await expect(
      sut.execute({ tenantId: TENANT_ID, entryId: 'nonexistent' }),
    ).rejects.toThrow('Lançamento financeiro não encontrado');
  });

  it('should throw when entry is not PAYABLE', async () => {
    mockPrisma.financeEntry.findFirst.mockResolvedValue(
      makeEntry({ type: 'RECEIVABLE' }),
    );

    await expect(
      sut.execute({ tenantId: TENANT_ID, entryId: ENTRY_ID }),
    ).rejects.toThrow('contas a pagar');
  });
});
