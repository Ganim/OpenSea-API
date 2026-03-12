/**
 * Data migration: Decrypt supplierName and customerName in finance_entries.
 *
 * These fields were previously encrypted with AES-256-GCM via FieldCipherService.
 * They contain business names (not PII), and encryption broke search (contains)
 * and aggregation (GROUP BY) queries. After this migration, they are stored as
 * plaintext — matching the behavior of the Supplier and Customer modules.
 *
 * Prerequisites:
 *   - FIELD_ENCRYPTION_KEY env var must be set (same key used for encryption)
 *   - Database must be accessible via DATABASE_URL
 *
 * Usage:
 *   npx tsx prisma/migrations/manual/decrypt-finance-names.ts
 *
 * Safety:
 *   - decryptFields has graceful fallback: if a value is already plaintext
 *     (decryption fails), it is left as-is.
 *   - Processes in batches of 500 to avoid memory issues.
 *   - Dry-run mode by default (set DRY_RUN=false to apply changes).
 */

import { PrismaClient } from '@prisma/generated/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { getFieldCipherService } from '../../src/services/security/field-cipher-service';

const BATCH_SIZE = 500;
const DRY_RUN = process.env.DRY_RUN !== 'false';

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });
  const cipher = getFieldCipherService();

  console.log(
    `Mode: ${DRY_RUN ? 'DRY RUN (set DRY_RUN=false to apply)' : 'LIVE — changes will be written'}`,
  );
  console.log('Starting decryption of supplierName and customerName...\n');

  let processed = 0;
  let decrypted = 0;
  let alreadyPlaintext = 0;
  let skippedNull = 0;
  let cursor: string | undefined;

  while (true) {
    const entries = await prisma.financeEntry.findMany({
      where: {
        OR: [{ supplierName: { not: null } }, { customerName: { not: null } }],
      },
      select: {
        id: true,
        supplierName: true,
        customerName: true,
      },
      take: BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: 'asc' },
    });

    if (entries.length === 0) break;

    for (const entry of entries) {
      const updates: Record<string, string> = {};

      for (const field of ['supplierName', 'customerName'] as const) {
        const value = entry[field];
        if (value === null) {
          skippedNull++;
          continue;
        }

        try {
          const decryptedValue = cipher.decrypt(value);
          // If decrypt succeeded, the value was encrypted
          if (decryptedValue !== value) {
            updates[field] = decryptedValue;
            decrypted++;
          } else {
            alreadyPlaintext++;
          }
        } catch {
          // Decryption failed — value is already plaintext
          alreadyPlaintext++;
        }
      }

      if (Object.keys(updates).length > 0) {
        if (!DRY_RUN) {
          await prisma.financeEntry.update({
            where: { id: entry.id },
            data: updates,
          });
        }
      }

      processed++;
    }

    cursor = entries[entries.length - 1].id;

    console.log(
      `  Processed ${processed} entries so far (${decrypted} decrypted, ${alreadyPlaintext} already plaintext, ${skippedNull} null fields)...`,
    );
  }

  console.log('\n--- Summary ---');
  console.log(`Total entries processed: ${processed}`);
  console.log(`Fields decrypted: ${decrypted}`);
  console.log(`Fields already plaintext: ${alreadyPlaintext}`);
  console.log(`Null fields skipped: ${skippedNull}`);

  if (DRY_RUN) {
    console.log(
      '\nDRY RUN complete. No changes written. Set DRY_RUN=false to apply.',
    );
  } else {
    console.log(
      '\nMigration complete. All values are now stored as plaintext.',
    );
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
