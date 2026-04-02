import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    esocialTable: {
      groupBy: vi.fn().mockResolvedValue([]),
    },
  },
}));

import { ListTablesUseCase } from './list-tables';
import { prisma } from '@/lib/prisma';

describe('ListTablesUseCase', () => {
  let sut: ListTablesUseCase;

  beforeEach(() => {
    sut = new ListTablesUseCase();
  });

  it('should return empty list when no tables exist', async () => {
    vi.mocked(prisma.esocialTable.groupBy).mockResolvedValue([] as unknown);

    const result = await sut.execute();

    expect(result.tables).toEqual([]);
  });

  it('should return tables with descriptions and counts', async () => {
    vi.mocked(prisma.esocialTable.groupBy).mockResolvedValue([
      { tableCode: '01', _count: { id: 15 } },
      { tableCode: '03', _count: { id: 10 } },
      { tableCode: '99', _count: { id: 5 } },
    ] as unknown);

    const result = await sut.execute();

    expect(result.tables).toHaveLength(3);
    expect(result.tables[0]).toEqual({
      tableCode: '01',
      description: 'Categorias de Trabalhador',
      itemCount: 15,
    });
    expect(result.tables[1]).toEqual({
      tableCode: '03',
      description: 'Naturezas de Rubrica',
      itemCount: 10,
    });
    expect(result.tables[2]).toEqual({
      tableCode: '99',
      description: 'Tabela 99',
      itemCount: 5,
    });
  });
});
