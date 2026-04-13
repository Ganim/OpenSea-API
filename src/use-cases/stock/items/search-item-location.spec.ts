import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => {
  return {
    prisma: {
      item: {
        findMany: vi.fn(),
      },
    },
  };
});

import { prisma } from '@/lib/prisma';
import { SearchItemLocationUseCase } from './search-item-location';

const mockPrisma = vi.mocked(prisma) as any;
const TENANT_ID = 'tenant-1';
let sut: SearchItemLocationUseCase;

function makePrismaItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 'item-1',
    currentQuantity: 10,
    barcode: 'BAR-001',
    variant: {
      name: 'Variante P',
      sku: 'SKU-001',
      product: { name: 'Camiseta' },
    },
    bin: {
      id: 'bin-1',
      address: 'WH1-Z1-A1-S1-P1',
      zone: {
        id: 'zone-1',
        code: 'Z1',
        name: 'Zone 1',
        warehouse: {
          id: 'wh-1',
          code: 'WH1',
          name: 'Warehouse 1',
        },
      },
    },
    ...overrides,
  };
}

describe('SearchItemLocationUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sut = new SearchItemLocationUseCase();
  });

  it('should return items with location data', async () => {
    mockPrisma.item.findMany.mockResolvedValue([makePrismaItem()] as unknown);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      query: 'Camiseta',
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].productName).toBe('Camiseta');
    expect(result.items[0].variantName).toBe('Variante P');
    expect(result.items[0].sku).toBe('SKU-001');
    expect(result.items[0].warehouse.code).toBe('WH1');
    expect(result.items[0].zone.code).toBe('Z1');
    expect(result.items[0].bin?.address).toBe('WH1-Z1-A1-S1-P1');
  });

  it('should include orphaned items (no bin)', async () => {
    mockPrisma.item.findMany.mockResolvedValue([
      makePrismaItem({ bin: null }),
    ] as unknown);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      query: 'Camiseta',
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].bin).toBeNull();
    expect(result.items[0].warehouse.id).toBe('');
    expect(result.items[0].zone.id).toBe('');
  });

  it('should filter out items with bin but no warehouse link', async () => {
    const itemWithBrokenLink = makePrismaItem({
      bin: {
        id: 'bin-2',
        address: 'ADDR',
        zone: { id: 'z', code: 'Z', name: 'Zone', warehouse: null },
      },
    });
    mockPrisma.item.findMany.mockResolvedValue([itemWithBrokenLink] as unknown);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      query: 'test',
    });

    expect(result.items).toHaveLength(0);
  });

  it('should respect default limit of 10', async () => {
    mockPrisma.item.findMany.mockResolvedValue([] as unknown);

    await sut.execute({ tenantId: TENANT_ID, query: 'test' });

    expect(mockPrisma.item.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10 }),
    );
  });

  it('should respect custom limit up to max 20', async () => {
    mockPrisma.item.findMany.mockResolvedValue([] as unknown);

    await sut.execute({ tenantId: TENANT_ID, query: 'test', limit: 15 });

    expect(mockPrisma.item.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 15 }),
    );
  });

  it('should cap limit at 20', async () => {
    mockPrisma.item.findMany.mockResolvedValue([] as unknown);

    await sut.execute({ tenantId: TENANT_ID, query: 'test', limit: 100 });

    expect(mockPrisma.item.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 20 }),
    );
  });

  it('should return both located and orphaned items', async () => {
    const locatedItem = makePrismaItem({ id: 'item-located' });
    const orphanedItem = makePrismaItem({
      id: 'item-orphaned',
      bin: null,
    });
    mockPrisma.item.findMany.mockResolvedValue([
      locatedItem,
      orphanedItem,
    ] as unknown);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      query: 'Camiseta',
    });

    expect(result.items).toHaveLength(2);
    const located = result.items.find((i) => i.itemId === 'item-located');
    const orphaned = result.items.find((i) => i.itemId === 'item-orphaned');
    expect(located?.bin).not.toBeNull();
    expect(orphaned?.bin).toBeNull();
  });

  it('should return empty results for no matches', async () => {
    mockPrisma.item.findMany.mockResolvedValue([] as unknown);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      query: 'nonexistent',
    });

    expect(result.items).toHaveLength(0);
  });
});
