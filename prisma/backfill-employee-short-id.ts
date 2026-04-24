/**
 * Standalone Backfill — Employee.shortId
 *
 * Popula o campo `shortId` (adicionado em Fase 1 do Emporion, Task 1)
 * para todos os Employees já existentes que ainda estão com `shortId = NULL`.
 *
 * O `shortId` passa a ser gerado automaticamente no `create-employee`
 * (Task 21 do Plan A). Este script cobre o universo pré-existente.
 *
 * Estratégia:
 * - Busca todos employees não-soft-deleted com shortId IS NULL.
 * - Para cada um, gera shortId via generateShortId (Task 10) e tenta persistir.
 * - Em colisão (P2002 unique por (short_id, tenant_id, deleted_at)), tenta
 *   outro candidato; até 10 tentativas por employee. Fail-fast após isso.
 *
 * Idempotente: empregados que já têm shortId não são tocados.
 *
 * Usage: npm run prisma:backfill-short-id
 * Production: npx tsx --env-file=.env.production prisma/backfill-employee-short-id.ts
 */

import { PrismaPg } from '@prisma/adapter-pg';

import { generateShortId } from '../src/lib/short-id/generate-short-id.js';

import { PrismaClient } from './generated/prisma/client.js';

try {
  process.loadEnvFile();
} catch {
  /* .env opcional */
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function backfill() {
  console.log('Backfill iniciado: Employee.shortId');

  const employees = await prisma.employee.findMany({
    where: {
      shortId: null,
      deletedAt: null,
    },
    select: { id: true, tenantId: true, fullName: true },
  });

  console.log(`${employees.length} employees sem shortId encontrados.`);

  let success = 0;
  let failed = 0;
  const maxAttempts = 10;

  for (const emp of employees) {
    let assigned = false;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const candidate = generateShortId();
      try {
        await prisma.employee.update({
          where: { id: emp.id },
          data: { shortId: candidate },
        });
        success++;
        assigned = true;
        break;
      } catch (err: unknown) {
        const e = err as { code?: string };
        if (e.code === 'P2002') {
          // Unique constraint violation — tenta outro candidato
          continue;
        }
        console.error(`Erro em employee ${emp.id} (${emp.fullName}):`, err);
        failed++;
        break;
      }
    }

    if (!assigned) {
      console.warn(
        `Employee ${emp.id} (${emp.fullName}, tenant ${emp.tenantId}) não recebeu shortId após ${maxAttempts} tentativas.`,
      );
      failed++;
    }
  }

  console.log(`Backfill concluído: ${success} sucesso, ${failed} falharam.`);
}

backfill()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
