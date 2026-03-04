/**
 * Data Migration Script: Encrypt existing plaintext data
 *
 * This script reads all existing records from models with sensitive fields,
 * encrypts the plaintext values, generates blind index hashes, and writes
 * the encrypted data back to the database.
 *
 * Usage:
 *   npx tsx scripts/encrypt-existing-data.ts
 *
 * Prerequisites:
 *   - FIELD_ENCRYPTION_KEY (64 hex chars) set in environment
 *   - FIELD_HMAC_KEY (16+ chars) set in environment
 *   - DATABASE_URL set in environment
 *
 * Safety:
 *   - Idempotent: checks if data is already encrypted before re-encrypting
 *   - Batched: processes 100 records at a time to avoid memory issues
 *   - Logged: prints progress for each model
 *   - Reversible: run decrypt-existing-data.ts to reverse (if ever needed)
 */

import { PrismaClient } from '../prisma/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { FieldCipherService } from '../src/services/security/field-cipher-service';
import { ENCRYPTED_FIELD_CONFIG } from '../src/services/security/encrypted-field-config';

process.loadEnvFile();

const BATCH_SIZE = 100;

// Initialize
const encKey = process.env.FIELD_ENCRYPTION_KEY;
const hmacKey = process.env.FIELD_HMAC_KEY;
const databaseUrl = process.env.DATABASE_URL;

if (!encKey || !hmacKey) {
  console.error(
    '❌ FIELD_ENCRYPTION_KEY and FIELD_HMAC_KEY must be set in environment',
  );
  process.exit(1);
}

if (!databaseUrl) {
  console.error('❌ DATABASE_URL must be set in environment');
  process.exit(1);
}

const cipher = new FieldCipherService(encKey, hmacKey);
const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

interface MigrationModelConfig {
  modelName: string;
  prismaModel: string; // Key on prisma client
  encryptedFields: readonly string[];
  hashFields: Record<string, string>;
  idField: string;
  tenantScoped: boolean;
}

const MODELS_TO_MIGRATE: MigrationModelConfig[] = [
  {
    modelName: 'Employee',
    prismaModel: 'employee',
    encryptedFields: ENCRYPTED_FIELD_CONFIG.Employee.encryptedFields,
    hashFields: ENCRYPTED_FIELD_CONFIG.Employee.hashFields,
    idField: 'id',
    tenantScoped: true,
  },
  {
    modelName: 'Customer',
    prismaModel: 'customer',
    encryptedFields: ENCRYPTED_FIELD_CONFIG.Customer.encryptedFields,
    hashFields: ENCRYPTED_FIELD_CONFIG.Customer.hashFields,
    idField: 'id',
    tenantScoped: true,
  },
  {
    modelName: 'Supplier',
    prismaModel: 'supplier',
    encryptedFields: ENCRYPTED_FIELD_CONFIG.Supplier.encryptedFields,
    hashFields: ENCRYPTED_FIELD_CONFIG.Supplier.hashFields,
    idField: 'id',
    tenantScoped: true,
  },
  {
    modelName: 'Manufacturer',
    prismaModel: 'manufacturer',
    encryptedFields: ENCRYPTED_FIELD_CONFIG.Manufacturer.encryptedFields,
    hashFields: ENCRYPTED_FIELD_CONFIG.Manufacturer.hashFields,
    idField: 'id',
    tenantScoped: true,
  },
  {
    modelName: 'BankAccount',
    prismaModel: 'bankAccount',
    encryptedFields: ENCRYPTED_FIELD_CONFIG.BankAccount.encryptedFields,
    hashFields: ENCRYPTED_FIELD_CONFIG.BankAccount.hashFields,
    idField: 'id',
    tenantScoped: true,
  },
  {
    modelName: 'FinanceEntry',
    prismaModel: 'financeEntry',
    encryptedFields: ENCRYPTED_FIELD_CONFIG.FinanceEntry.encryptedFields,
    hashFields: ENCRYPTED_FIELD_CONFIG.FinanceEntry.hashFields,
    idField: 'id',
    tenantScoped: true,
  },
  {
    modelName: 'Loan',
    prismaModel: 'loan',
    encryptedFields: ENCRYPTED_FIELD_CONFIG.Loan.encryptedFields,
    hashFields: ENCRYPTED_FIELD_CONFIG.Loan.hashFields,
    idField: 'id',
    tenantScoped: true,
  },
  {
    modelName: 'Consortium',
    prismaModel: 'consortium',
    encryptedFields: ENCRYPTED_FIELD_CONFIG.Consortium.encryptedFields,
    hashFields: ENCRYPTED_FIELD_CONFIG.Consortium.hashFields,
    idField: 'id',
    tenantScoped: true,
  },
  {
    modelName: 'Organization',
    prismaModel: 'organization',
    encryptedFields: ENCRYPTED_FIELD_CONFIG.Organization.encryptedFields,
    hashFields: ENCRYPTED_FIELD_CONFIG.Organization.hashFields,
    idField: 'id',
    tenantScoped: true,
  },
  {
    modelName: 'OrganizationFiscalSettings',
    prismaModel: 'organizationFiscalSettings',
    encryptedFields:
      ENCRYPTED_FIELD_CONFIG.OrganizationFiscalSettings.encryptedFields,
    hashFields: ENCRYPTED_FIELD_CONFIG.OrganizationFiscalSettings.hashFields,
    idField: 'id',
    tenantScoped: false,
  },
  {
    modelName: 'OrganizationStakeholder',
    prismaModel: 'organizationStakeholder',
    encryptedFields:
      ENCRYPTED_FIELD_CONFIG.OrganizationStakeholder.encryptedFields,
    hashFields: ENCRYPTED_FIELD_CONFIG.OrganizationStakeholder.hashFields,
    idField: 'id',
    tenantScoped: false,
  },
  {
    modelName: 'Company',
    prismaModel: 'company',
    encryptedFields: ENCRYPTED_FIELD_CONFIG.Company.encryptedFields,
    hashFields: ENCRYPTED_FIELD_CONFIG.Company.hashFields,
    idField: 'id',
    tenantScoped: true,
  },
  {
    modelName: 'CompanyFiscalSettings',
    prismaModel: 'companyFiscalSettings',
    encryptedFields:
      ENCRYPTED_FIELD_CONFIG.CompanyFiscalSettings.encryptedFields,
    hashFields: ENCRYPTED_FIELD_CONFIG.CompanyFiscalSettings.hashFields,
    idField: 'id',
    tenantScoped: false,
  },
  {
    modelName: 'CompanyStakeholder',
    prismaModel: 'companyStakeholder',
    encryptedFields:
      ENCRYPTED_FIELD_CONFIG.CompanyStakeholder.encryptedFields,
    hashFields: ENCRYPTED_FIELD_CONFIG.CompanyStakeholder.hashFields,
    idField: 'id',
    tenantScoped: false,
  },
  {
    modelName: 'Absence',
    prismaModel: 'absence',
    encryptedFields: ENCRYPTED_FIELD_CONFIG.Absence.encryptedFields,
    hashFields: ENCRYPTED_FIELD_CONFIG.Absence.hashFields,
    idField: 'id',
    tenantScoped: true,
  },
  {
    modelName: 'StorageShareLink',
    prismaModel: 'storageShareLink',
    encryptedFields: ENCRYPTED_FIELD_CONFIG.StorageShareLink.encryptedFields,
    hashFields: ENCRYPTED_FIELD_CONFIG.StorageShareLink.hashFields,
    idField: 'id',
    tenantScoped: true,
  },
];

async function migrateModel(config: MigrationModelConfig): Promise<{
  processed: number;
  encrypted: number;
  skipped: number;
  errors: number;
}> {
  const stats = { processed: 0, encrypted: 0, skipped: 0, errors: 0 };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const model = (prisma as any)[config.prismaModel];
  if (!model) {
    console.error(`  ⚠️  Model ${config.prismaModel} not found on Prisma client`);
    return stats;
  }

  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    const records = await model.findMany({
      take: BATCH_SIZE,
      skip,
      orderBy: { id: 'asc' },
    });

    if (records.length === 0) {
      hasMore = false;
      break;
    }

    for (const record of records) {
      stats.processed++;

      try {
        // Check if already encrypted (check first encrypted field)
        const firstField = config.encryptedFields[0];
        const firstValue = record[firstField];
        if (firstValue && typeof firstValue === 'string' && cipher.isEncrypted(firstValue)) {
          stats.skipped++;
          continue;
        }

        // Build update data
        const updateData: Record<string, unknown> = {};

        // Encrypt fields
        for (const field of config.encryptedFields) {
          const value = record[field];
          if (value !== null && value !== undefined && typeof value === 'string') {
            updateData[field] = cipher.encrypt(value);
          }
        }

        // Generate hashes
        for (const [sourceField, hashColumn] of Object.entries(config.hashFields)) {
          const value = record[sourceField];
          if (value && typeof value === 'string') {
            updateData[hashColumn] = cipher.blindIndex(value);
          } else {
            updateData[hashColumn] = null;
          }
        }

        // Update record
        if (Object.keys(updateData).length > 0) {
          await model.update({
            where: { [config.idField]: record[config.idField] },
            data: updateData,
          });
          stats.encrypted++;
        }
      } catch (error) {
        stats.errors++;
        console.error(
          `  ❌ Error encrypting ${config.modelName} id=${record[config.idField]}:`,
          error instanceof Error ? error.message : error,
        );
      }
    }

    skip += records.length;
    if (records.length < BATCH_SIZE) {
      hasMore = false;
    }
  }

  return stats;
}

async function main() {
  console.log('🔐 Starting data encryption migration...\n');
  console.log(`  Encryption key: ${encKey!.substring(0, 8)}...`);
  console.log(`  HMAC key: ${hmacKey!.substring(0, 8)}...\n`);

  const totalStats = {
    processed: 0,
    encrypted: 0,
    skipped: 0,
    errors: 0,
  };

  for (const config of MODELS_TO_MIGRATE) {
    console.log(`📋 Migrating ${config.modelName}...`);
    const stats = await migrateModel(config);
    console.log(
      `   ✅ Processed: ${stats.processed}, Encrypted: ${stats.encrypted}, Skipped: ${stats.skipped}, Errors: ${stats.errors}`,
    );

    totalStats.processed += stats.processed;
    totalStats.encrypted += stats.encrypted;
    totalStats.skipped += stats.skipped;
    totalStats.errors += stats.errors;
  }

  console.log('\n📊 Migration Summary:');
  console.log(`   Total Processed: ${totalStats.processed}`);
  console.log(`   Total Encrypted: ${totalStats.encrypted}`);
  console.log(`   Total Skipped:   ${totalStats.skipped}`);
  console.log(`   Total Errors:    ${totalStats.errors}`);

  if (totalStats.errors > 0) {
    console.log('\n⚠️  Some records failed to encrypt. Review errors above.');
    process.exit(1);
  }

  console.log('\n✅ Data encryption migration complete!');
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
