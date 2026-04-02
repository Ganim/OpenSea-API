import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    esocialTable: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
    },
  },
}));

import { GetTableItemsUseCase } from './get-table-items';
import { prisma } from '@/lib/prisma';

describe('GetTableItemsUseCase', () => {
  let sut: GetTableItemsUseCase;

  beforeEach(() => {
    sut = new GetTableItemsUseCase();
    vi.mocked(prisma.esocialTable.findMany).mockResolvedValue([]);
    vi.mocked(prisma.esocialTable.findFirst).mockResolvedValue(null);
  });

  it('should throw ResourceNotFoundError if table does not exist', async () => {
    vi.mocked(prisma.esocialTable.findMany).mockResolvedValue([]);
    vi.mocked(prisma.esocialTable.findFirst).mockResolvedValue(null);

    await expect(
      sut.execute({ tableCode: 'NONEXISTENT' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should return items for existing table', async () => {
    vi.mocked(prisma.esocialTable.findMany).mockResolvedValue([
      {
        id: 'item-1',
        tableCode: '01',
        itemCode: '101',
        description: 'Empregado - Geral',
        isActive: true,
      },
    ] as unknown);

    const result = await sut.execute({ tableCode: '01' });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].itemCode).toBe('101');
    expect(result.total).toBe(1);
  });

  it('should not throw when table exists but search returns empty', async () => {
    vi.mocked(prisma.esocialTable.findMany).mockResolvedValue([]);

    // With search param, it should not throw even if empty
    const result = await sut.execute({
      tableCode: '01',
      search: 'nonexistent-term',
    });

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });
});
