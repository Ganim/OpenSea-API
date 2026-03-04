/**
 * Migration script: Encrypt existing (unencrypted) files in S3.
 *
 * This script is idempotent — it only processes files where isEncrypted=false.
 * It should be run ONCE after deploying the encryption feature and setting
 * the STORAGE_ENCRYPTION_KEY environment variable.
 *
 * Process:
 * 1. Query all StorageFiles where isEncrypted=false and deletedAt IS NULL
 * 2. For each file: download from S3 → encrypt → re-upload (overwrite) → update DB
 * 3. Also encrypt all StorageFileVersion S3 objects for those files
 * 4. Process in batches of 10 to avoid memory pressure
 *
 * Usage:
 *   npx tsx scripts/encrypt-existing-files.ts
 */

import { env } from '../src/@env';
import { prisma } from '../src/lib/prisma';
import { EncryptionService } from '../src/services/storage/encryption-service';
import { S3FileUploadService } from '../src/services/storage/s3-file-upload-service';
import { LocalFileUploadService } from '../src/services/storage/local-file-upload-service';
import type { FileUploadService } from '../src/services/storage/file-upload-service';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';

const BATCH_SIZE = 10;

async function main() {
  const encryptionKey = env.STORAGE_ENCRYPTION_KEY;
  if (!encryptionKey) {
    console.error(
      '[encrypt-existing] STORAGE_ENCRYPTION_KEY not set. Aborting.',
    );
    process.exit(1);
  }

  const encryptionService = new EncryptionService(encryptionKey);

  // Build S3 client for direct put (overwrite to same key)
  const s3Client = new S3Client({
    endpoint: env.S3_ENDPOINT!,
    region: env.S3_REGION ?? 'us-east-1',
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID!,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
  });
  const bucket = env.S3_BUCKET;

  // Also need the file upload service for getObject (handles gzip etc.)
  const fileUploadService: FileUploadService = env.S3_ENDPOINT
    ? new S3FileUploadService()
    : new LocalFileUploadService();

  console.log(`[encrypt-existing] Starting at ${new Date().toISOString()}`);

  // Count total unencrypted files
  const totalFiles = await prisma.storageFile.count({
    where: { isEncrypted: false, deletedAt: null },
  });

  console.log(`[encrypt-existing] Found ${totalFiles} unencrypted files`);

  if (totalFiles === 0) {
    console.log('[encrypt-existing] Nothing to do. All files already encrypted.');
    process.exit(0);
  }

  let processed = 0;
  let errors = 0;
  let versionsProcessed = 0;

  // Process files in batches
  while (true) {
    const files = await prisma.storageFile.findMany({
      where: { isEncrypted: false, deletedAt: null },
      take: BATCH_SIZE,
      select: {
        id: true,
        fileKey: true,
        name: true,
        mimeType: true,
        versions: {
          select: {
            id: true,
            fileKey: true,
            mimeType: true,
          },
        },
      },
    });

    if (files.length === 0) break;

    for (const file of files) {
      try {
        // 1. Encrypt main file
        const buffer = await fileUploadService.getObject(file.fileKey);
        const encrypted = encryptionService.encrypt(buffer);

        await s3Client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: file.fileKey,
            Body: encrypted,
            ContentType: 'application/octet-stream', // encrypted data, not original mime
          }),
        );

        // 2. Encrypt all versions
        for (const version of file.versions) {
          try {
            const versionBuffer = await fileUploadService.getObject(
              version.fileKey,
            );
            const encryptedVersion = encryptionService.encrypt(versionBuffer);

            await s3Client.send(
              new PutObjectCommand({
                Bucket: bucket,
                Key: version.fileKey,
                Body: encryptedVersion,
                ContentType: 'application/octet-stream',
              }),
            );

            versionsProcessed++;
          } catch (err) {
            console.error(
              `[encrypt-existing] Error encrypting version ${version.id} of file ${file.id}:`,
              err instanceof Error ? err.message : err,
            );
            errors++;
          }
        }

        // 3. Mark file as encrypted in DB
        await prisma.storageFile.update({
          where: { id: file.id },
          data: { isEncrypted: true },
        });

        processed++;
        console.log(
          `[encrypt-existing] Encrypted ${processed}/${totalFiles} files (${file.name})`,
        );
      } catch (err) {
        console.error(
          `[encrypt-existing] Error encrypting file ${file.id} (${file.name}):`,
          err instanceof Error ? err.message : err,
        );
        errors++;
      }
    }
  }

  console.log(`\n[encrypt-existing] Summary:`);
  console.log(`  Files encrypted: ${processed}/${totalFiles}`);
  console.log(`  Versions encrypted: ${versionsProcessed}`);
  console.log(`  Errors: ${errors}`);
  console.log(`[encrypt-existing] Done at ${new Date().toISOString()}`);

  await prisma.$disconnect();
  process.exit(errors > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('[encrypt-existing] Fatal error:', err);
  process.exit(1);
});
