/**
 * Standalone Backfill Script — Phase 6 / Code Review CR-02 (LGPD)
 *
 * Remove o campo `cpfTrab` do JSON `filters` de ComplianceArtifact tipo
 * `S1200_XML` já persistidos ANTES do fix do use-case.
 *
 * Contexto (CR-02):
 *   O use-case `BuildS1200ForCompetenciaUseCase` gravava `cpfTrab` dentro
 *   de `filters` junto com `employeeId`, `batchId`, `eventId`. Como a
 *   listagem de artefatos (`GET /v1/hr/compliance/artifacts`) expõe
 *   `filters` verbatim no DTO, isso vazava CPF para o frontend apesar de
 *   ser PII sensível (LGPD Art. 5º). O fix remove o campo do use-case,
 *   porém registros antigos ainda carregam o CPF.
 *
 * Estratégia:
 *   - Varre TODOS os ComplianceArtifact `type=S1200_XML` (todos tenants).
 *   - Se `filters.cpfTrab` existir, faz `UPDATE` removendo a chave com
 *     uma cópia sanitizada.
 *   - Log + contador final; exit code 0 mesmo se 0 registros afetados.
 *
 * Idempotente: rodar N vezes é seguro (não modifica linhas já limpas).
 *
 * O CPF permanece apenas dentro do XML S-1200 em storage privado (R2),
 * acessível somente via rota autenticada de download.
 *
 * Usage:
 *   npx tsx --env-file=.env prisma/backfill-s1200-strip-cpftrab.ts
 */

import { PrismaClient } from './generated/prisma/client.js';

const prisma = new PrismaClient();

async function main() {
  console.log(
    '[backfill-s1200-strip-cpftrab] Iniciando sanitização LGPD (CR-02)...',
  );

  // Busca todos os artefatos S1200_XML (cross-tenant). Filtramos em memória
  // porque `filters` é JSON e o Prisma path-query não é portável em todas as
  // versões — o volume esperado é baixo (apenas Phase 06 em diante).
  const artifacts = await prisma.complianceArtifact.findMany({
    where: { type: 'S1200_XML' },
    select: { id: true, tenantId: true, filters: true },
  });

  let sanitized = 0;
  let skipped = 0;

  for (const artifact of artifacts) {
    const filters =
      artifact.filters && typeof artifact.filters === 'object'
        ? (artifact.filters as Record<string, unknown>)
        : null;

    if (!filters || !('cpfTrab' in filters)) {
      skipped++;
      continue;
    }

    const { cpfTrab: _cpfTrab, ...sanitizedFilters } = filters;
    void _cpfTrab;

    await prisma.complianceArtifact.update({
      where: { id: artifact.id },
      data: { filters: sanitizedFilters },
    });
    sanitized++;
    console.log(
      `  [ok] ${artifact.id} (tenant=${artifact.tenantId}) — cpfTrab removido.`,
    );
  }

  console.log(
    `[backfill-s1200-strip-cpftrab] Concluído. ` +
      `Sanitizados: ${sanitized} | Já limpos: ${skipped} | Total varredos: ${artifacts.length}`,
  );
}

main()
  .catch((err) => {
    console.error('[backfill-s1200-strip-cpftrab] FAILED:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
