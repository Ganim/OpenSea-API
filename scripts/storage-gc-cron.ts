/**
 * Cron script: Storage Garbage Collection
 *
 * Permanently deletes soft-deleted files that have passed the retention period.
 * This includes:
 * 1. Deleting physical files from S3/local storage
 * 2. Deleting all associated file versions (physical + DB records)
 * 3. Hard-deleting the file DB records
 *
 * Default retention: 30 days after soft-delete
 *
 * Usage:
 *   npx tsx scripts/storage-gc-cron.ts
 *
 * Fly.io Machine schedule: daily at 03:00 UTC
 */

import { makePurgeDeletedFilesUseCase } from '../src/use-cases/storage/files/factories/make-purge-deleted-files-use-case';

async function main() {
  console.log(`[storage-gc] Starting at ${new Date().toISOString()}`);

  const useCase = makePurgeDeletedFilesUseCase();

  const result = await useCase.execute({
    retentionDays: 30,
    batchSize: 500,
  });

  console.log(`[storage-gc] Summary:`);
  console.log(`  Purged files: ${result.purgedFiles}`);
  console.log(`  Purged versions: ${result.purgedVersions}`);
  console.log(
    `  Freed storage: ${(result.freedBytes / 1024 / 1024).toFixed(2)} MB`,
  );
  console.log(`  Errors: ${result.errors}`);
  console.log(`[storage-gc] Done at ${new Date().toISOString()}`);

  process.exit(result.errors > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('[storage-gc] Fatal error:', err);
  process.exit(1);
});
