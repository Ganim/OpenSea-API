/**
 * Seed script for eSocial reference tables.
 * Populates EsocialTable with government-defined data.
 *
 * Usage: Import and call seedEsocialTables(prisma) from the main seed.
 */
import { CATEGORIAS_TRABALHADOR } from './categorias-trabalhador';
import { MOTIVOS_AFASTAMENTO } from './motivos-afastamento';
import { NATUREZAS_RUBRICA } from './naturezas-rubrica';

interface PrismaLike {
  esocialTable: {
    upsert: (args: {
      where: { tableCode_itemCode: { tableCode: string; itemCode: string } };
      create: {
        tableCode: string;
        itemCode: string;
        description: string;
        isActive: boolean;
      };
      update: { description: string; isActive: boolean };
    }) => Promise<unknown>;
  };
}

interface TableEntry {
  code: string;
  description: string;
}

async function seedTable(
  prisma: PrismaLike,
  tableCode: string,
  entries: TableEntry[],
): Promise<number> {
  let count = 0;

  for (const entry of entries) {
    await prisma.esocialTable.upsert({
      where: {
        tableCode_itemCode: {
          tableCode,
          itemCode: entry.code,
        },
      },
      create: {
        tableCode,
        itemCode: entry.code,
        description: entry.description,
        isActive: true,
      },
      update: {
        description: entry.description,
        isActive: true,
      },
    });
    count++;
  }

  return count;
}

export async function seedEsocialTables(prisma: PrismaLike): Promise<void> {
  console.log('  Seeding eSocial reference tables...');

  const table01Count = await seedTable(prisma, '01', CATEGORIAS_TRABALHADOR);
  console.log(
    `    Table 01 (Categorias de Trabalhador): ${table01Count} entries`,
  );

  const table03Count = await seedTable(prisma, '03', NATUREZAS_RUBRICA);
  console.log(`    Table 03 (Naturezas de Rubrica): ${table03Count} entries`);

  const table18Count = await seedTable(prisma, '18', MOTIVOS_AFASTAMENTO);
  console.log(`    Table 18 (Motivos de Afastamento): ${table18Count} entries`);

  console.log(
    `  eSocial tables seeded: ${table01Count + table03Count + table18Count} total entries`,
  );
}
