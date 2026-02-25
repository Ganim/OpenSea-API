/**
 * Cron script: Archive Expired Files
 *
 * Finds active files with expiresAt < now() and archives them.
 * Runs per-tenant to respect multi-tenant boundaries.
 *
 * Usage:
 *   npx tsx scripts/archive-expired-files-cron.ts
 *
 * Fly.io Machine schedule: daily (recommended)
 */

import { prisma } from '../src/lib/prisma';
import { PrismaStorageFilesRepository } from '../src/repositories/storage/prisma/prisma-storage-files-repository';
import { ArchiveExpiredFilesUseCase } from '../src/use-cases/storage/files/archive-expired-files';

async function main() {
  console.log(
    `[archive-expired-files] Starting at ${new Date().toISOString()}`,
  );

  const storageFilesRepository = new PrismaStorageFilesRepository();
  const useCase = new ArchiveExpiredFilesUseCase(storageFilesRepository);

  // Fetch all active tenants
  const tenants = await prisma.tenant.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, name: true },
  });

  console.log(
    `[archive-expired-files] Found ${tenants.length} active tenants`,
  );

  let totalArchived = 0;
  let totalErrors = 0;

  for (const tenant of tenants) {
    try {
      const result = await useCase.execute({
        tenantId: tenant.id,
        batchSize: 100,
      });

      totalArchived += result.archivedCount;
      totalErrors += result.errors;

      if (result.archivedCount > 0) {
        console.log(
          `[archive-expired-files] Tenant "${tenant.name}": ${result.archivedCount} files archived, ${result.errors} errors`,
        );
      }
    } catch (error) {
      console.error(
        `[archive-expired-files] Error for tenant "${tenant.name}":`,
        error,
      );
      totalErrors++;
    }
  }

  console.log(`[archive-expired-files] Summary:`);
  console.log(`  Archived files: ${totalArchived}`);
  console.log(`  Errors: ${totalErrors}`);
  console.log(
    `[archive-expired-files] Done at ${new Date().toISOString()}`,
  );

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('[archive-expired-files] Fatal error:', err);
  process.exit(1);
});
