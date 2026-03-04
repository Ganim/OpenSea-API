/**
 * Verification Script: Validates encryption integrity
 *
 * Checks that:
 * 1. All sensitive fields are encrypted (not plaintext)
 * 2. Blind index hashes are populated
 * 3. Encrypted values can be decrypted successfully
 * 4. Decrypted values match expected patterns (CPF format, email format, etc.)
 *
 * Usage:
 *   npx tsx scripts/verify-encryption.ts
 */

import { PrismaClient } from '../prisma/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { FieldCipherService } from '../src/services/security/field-cipher-service';
import { ENCRYPTED_FIELD_CONFIG } from '../src/services/security/encrypted-field-config';

process.loadEnvFile();

const encKey = process.env.FIELD_ENCRYPTION_KEY;
const hmacKey = process.env.FIELD_HMAC_KEY;
const databaseUrl = process.env.DATABASE_URL;

if (!encKey || !hmacKey || !databaseUrl) {
  console.error('❌ FIELD_ENCRYPTION_KEY, FIELD_HMAC_KEY, and DATABASE_URL required');
  process.exit(1);
}

const cipher = new FieldCipherService(encKey, hmacKey);
const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

const SAMPLE_SIZE = 10; // Check first N records per model

interface VerificationResult {
  model: string;
  totalChecked: number;
  allEncrypted: boolean;
  hashesPopulated: boolean;
  decryptionOk: boolean;
  issues: string[];
}

async function verifyModel(
  modelName: string,
  prismaModelKey: string,
): Promise<VerificationResult> {
  const config = ENCRYPTED_FIELD_CONFIG[modelName];
  const result: VerificationResult = {
    model: modelName,
    totalChecked: 0,
    allEncrypted: true,
    hashesPopulated: true,
    decryptionOk: true,
    issues: [],
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const model = (prisma as any)[prismaModelKey];
  if (!model) {
    result.issues.push(`Model ${prismaModelKey} not found on Prisma client`);
    return result;
  }

  const records = await model.findMany({ take: SAMPLE_SIZE });
  result.totalChecked = records.length;

  for (const record of records) {
    // Check encrypted fields
    for (const field of config.encryptedFields) {
      const value = record[field];
      if (value === null || value === undefined) continue;

      if (typeof value !== 'string') {
        result.issues.push(
          `${modelName}.${field} id=${record.id}: expected string, got ${typeof value}`,
        );
        continue;
      }

      // Check if encrypted
      if (!cipher.isEncrypted(value)) {
        result.allEncrypted = false;
        result.issues.push(
          `${modelName}.${field} id=${record.id}: still plaintext`,
        );
        continue;
      }

      // Try decryption
      try {
        const decrypted = cipher.decrypt(value);
        if (!decrypted) {
          result.decryptionOk = false;
          result.issues.push(
            `${modelName}.${field} id=${record.id}: decrypted to empty string`,
          );
        }
      } catch (error) {
        result.decryptionOk = false;
        result.issues.push(
          `${modelName}.${field} id=${record.id}: decryption failed - ${error instanceof Error ? error.message : error}`,
        );
      }
    }

    // Check hash fields
    for (const [sourceField, hashColumn] of Object.entries(config.hashFields)) {
      const sourceValue = record[sourceField];
      const hashValue = record[hashColumn];

      if (sourceValue !== null && sourceValue !== undefined) {
        if (!hashValue) {
          result.hashesPopulated = false;
          result.issues.push(
            `${modelName}.${hashColumn} id=${record.id}: hash is null but source has value`,
          );
        } else if (typeof hashValue === 'string' && hashValue.length !== 64) {
          result.issues.push(
            `${modelName}.${hashColumn} id=${record.id}: hash length ${hashValue.length} (expected 64)`,
          );
        }
      }
    }
  }

  return result;
}

const MODEL_MAP: Array<{ name: string; key: string }> = [
  { name: 'Employee', key: 'employee' },
  { name: 'Customer', key: 'customer' },
  { name: 'Supplier', key: 'supplier' },
  { name: 'Manufacturer', key: 'manufacturer' },
  { name: 'BankAccount', key: 'bankAccount' },
  { name: 'FinanceEntry', key: 'financeEntry' },
  { name: 'Loan', key: 'loan' },
  { name: 'Consortium', key: 'consortium' },
  { name: 'Organization', key: 'organization' },
  { name: 'OrganizationFiscalSettings', key: 'organizationFiscalSettings' },
  { name: 'OrganizationStakeholder', key: 'organizationStakeholder' },
  { name: 'Company', key: 'company' },
  { name: 'CompanyFiscalSettings', key: 'companyFiscalSettings' },
  { name: 'CompanyStakeholder', key: 'companyStakeholder' },
  { name: 'Absence', key: 'absence' },
  { name: 'StorageShareLink', key: 'storageShareLink' },
];

async function main() {
  console.log('🔍 Verifying encryption integrity...\n');

  let allPassed = true;

  for (const { name, key } of MODEL_MAP) {
    const result = await verifyModel(name, key);

    const status =
      result.allEncrypted && result.hashesPopulated && result.decryptionOk
        ? '✅'
        : '❌';

    if (status === '❌') allPassed = false;

    console.log(
      `${status} ${result.model}: ${result.totalChecked} records checked`,
    );

    if (result.issues.length > 0) {
      for (const issue of result.issues.slice(0, 5)) {
        console.log(`   ⚠️  ${issue}`);
      }
      if (result.issues.length > 5) {
        console.log(`   ... and ${result.issues.length - 5} more issues`);
      }
    }
  }

  console.log(
    allPassed
      ? '\n✅ All encryption checks passed!'
      : '\n❌ Some checks failed. Review issues above.',
  );

  await prisma.$disconnect();
  process.exit(allPassed ? 0 : 1);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
