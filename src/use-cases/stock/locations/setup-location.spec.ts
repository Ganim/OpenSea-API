import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';

vi.mock('@/lib/prisma', () => {
  const mockTx = {
    warehouse: {
      create: vi.fn(),
    },
    zone: {
      create: vi.fn(),
    },
    bin: {
      createMany: vi.fn(),
    },
  };

  return {
    prisma: {
      warehouse: {
        findFirst: vi.fn(),
      },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
      $transaction: vi.fn((fn: Function) => fn(mockTx)),
      __mockTx: mockTx,
    },
    Prisma: {},
  };
});

import { prisma } from '@/lib/prisma';
import { SetupLocationUseCase } from './setup-location';

const mockPrisma = prisma as unknown as Record<
  string,
  Record<string, ReturnType<typeof vi.fn>>
> & { __mockTx: Record<string, Record<string, ReturnType<typeof vi.fn>>> };
const mockTx = mockPrisma.__mockTx;

const TENANT_ID = 'tenant-1';
let sut: SetupLocationUseCase;

describe('SetupLocationUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sut = new SetupLocationUseCase();

    mockPrisma.warehouse.findFirst.mockResolvedValue(null);
    mockTx.warehouse.create.mockResolvedValue({
      id: 'wh-1',
      code: 'WH1',
      name: 'Warehouse 1',
      description: null,
    });
    mockTx.zone.create.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({
        id: `zone-${data.code}`,
        code: data.code,
        name: data.name,
      }),
    );
    mockTx.bin.createMany.mockResolvedValue({ count: 0 });
  });

  it('should create a warehouse with zones and bins', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      warehouse: { code: 'wh1', name: 'Warehouse 1' },
      zones: [
        {
          code: 'z1',
          name: 'Zone 1',
          structure: {
            aisleConfigs: [{ shelvesPerAisle: 2, binsPerShelf: 3 }],
          },
        },
      ],
    });

    expect(result.warehouse.code).toBe('WH1');
    expect(result.warehouse.name).toBe('Warehouse 1');
    expect(result.zones).toHaveLength(1);
    expect(result.zones[0].code).toBe('Z1');
    expect(result.zones[0].binCount).toBe(6); // 1 aisle * 2 shelves * 3 bins
    expect(result.totalBinsCreated).toBe(6);
  });

  it('should create a warehouse with zone but no bins (no structure)', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      warehouse: { code: 'wh2', name: 'Simple Warehouse' },
      zones: [{ code: 'z1', name: 'Zone 1' }],
    });

    expect(result.zones).toHaveLength(1);
    expect(result.zones[0].binCount).toBe(0);
    expect(result.totalBinsCreated).toBe(0);
    expect(mockTx.bin.createMany).not.toHaveBeenCalled();
  });

  it('should throw BadRequestError for duplicate warehouse code', async () => {
    mockPrisma.warehouse.findFirst.mockResolvedValue({
      id: 'existing',
      code: 'WH1',
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        warehouse: { code: 'wh1', name: 'Warehouse' },
        zones: [],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw BadRequestError for duplicate zone codes in request', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        warehouse: { code: 'wh1', name: 'Warehouse' },
        zones: [
          { code: 'z1', name: 'Zone 1' },
          { code: 'z1', name: 'Zone 2' },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should uppercase warehouse and zone codes', async () => {
    await sut.execute({
      tenantId: TENANT_ID,
      warehouse: { code: 'lower', name: 'Test' },
      zones: [{ code: 'zone', name: 'Zone' }],
    });

    expect(mockPrisma.warehouse.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ code: 'LOWER' }),
      }),
    );

    expect(mockTx.zone.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ code: 'ZONE' }),
      }),
    );
  });

  it('should create multiple zones with different structures', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      warehouse: { code: 'wh1', name: 'Big Warehouse' },
      zones: [
        {
          code: 'z1',
          name: 'Zone 1',
          structure: {
            aisleConfigs: [{ shelvesPerAisle: 2, binsPerShelf: 2 }],
          },
        },
        {
          code: 'z2',
          name: 'Zone 2',
          structure: {
            aisleConfigs: [
              { shelvesPerAisle: 3, binsPerShelf: 1 },
              { shelvesPerAisle: 2, binsPerShelf: 2 },
            ],
          },
        },
      ],
    });

    expect(result.zones).toHaveLength(2);
    expect(result.zones[0].binCount).toBe(4); // 1 * 2 * 2
    expect(result.zones[1].binCount).toBe(7); // (3*1) + (2*2) = 3+4 = 7
    expect(result.totalBinsCreated).toBe(11);
  });

  it('should include warehouse description when provided', async () => {
    mockTx.warehouse.create.mockResolvedValue({
      id: 'wh-1',
      code: 'WH1',
      name: 'Warehouse',
      description: 'Main storage',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      warehouse: {
        code: 'wh1',
        name: 'Warehouse',
        description: 'Main storage',
      },
      zones: [],
    });

    expect(result.warehouse.description).toBe('Main storage');
  });
});
