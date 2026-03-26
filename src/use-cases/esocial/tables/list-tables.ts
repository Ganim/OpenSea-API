import { prisma } from '@/lib/prisma';

export interface ListTablesResponse {
  tables: Array<{
    tableCode: string;
    description: string;
    itemCount: number;
  }>;
}

const TABLE_DESCRIPTIONS: Record<string, string> = {
  '01': 'Categorias de Trabalhador',
  '03': 'Naturezas de Rubrica',
  '18': 'Motivos de Afastamento',
};

/**
 * List all available eSocial reference tables with item counts.
 */
export class ListTablesUseCase {
  async execute(): Promise<ListTablesResponse> {
    const groups = await prisma.esocialTable.groupBy({
      by: ['tableCode'],
      _count: { id: true },
      where: { isActive: true },
      orderBy: { tableCode: 'asc' },
    });

    const tables = groups.map((g) => ({
      tableCode: g.tableCode,
      description: TABLE_DESCRIPTIONS[g.tableCode] ?? `Tabela ${g.tableCode}`,
      itemCount: g._count.id,
    }));

    return { tables };
  }
}
