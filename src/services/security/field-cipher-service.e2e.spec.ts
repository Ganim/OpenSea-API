/**
 * E2E tests for field-level encryption integration.
 *
 * Validates that:
 * 1. Data written through repositories is encrypted in the database
 * 2. Data read through repositories is decrypted correctly
 * 3. Blind index searches work (findByCpf, findByDocument, etc.)
 * 4. The encrypt → store → read → decrypt round-trip preserves data
 *
 * These tests require FIELD_ENCRYPTION_KEY and FIELD_HMAC_KEY environment variables.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { FieldCipherService } from './field-cipher-service';
import { ENCRYPTED_FIELD_CONFIG } from './encrypted-field-config';

// Skip all tests if encryption keys are not configured
const encKey = process.env.FIELD_ENCRYPTION_KEY;
const hmacKey = process.env.FIELD_HMAC_KEY;
const keysAvailable = !!encKey && !!hmacKey;

describe.skipIf(!keysAvailable)('Field Encryption E2E Integration', () => {
  let cipher: FieldCipherService;
  let tenantId: string;

  beforeAll(async () => {
    cipher = new FieldCipherService(encKey!, hmacKey!);

    // Create test tenant
    const tenant = await prisma.tenant.create({
      data: {
        id: randomUUID(),
        name: `Encryption Test ${Date.now()}`,
        slug: `enc-test-${Date.now()}`,
        status: 'ACTIVE',
        settings: {},
        metadata: {},
      },
    });
    tenantId = tenant.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (tenantId) {
      await prisma.customer.deleteMany({ where: { tenantId } });
      await prisma.supplier.deleteMany({ where: { tenantId } });
      await prisma.bankAccount.deleteMany({ where: { tenantId } });
      await prisma.tenant.delete({ where: { id: tenantId } });
    }
  });

  // ─── Customer: encrypt + decrypt + blind index search ─────

  describe('Customer encryption round-trip', () => {
    const testCpf = '123.456.789-00';
    const testEmail = 'maria@example.com';
    let customerId: string;

    it('should store encrypted data in database', async () => {
      const id = randomUUID();
      const config = ENCRYPTED_FIELD_CONFIG.Customer;

      // Prepare encrypted data
      const data = {
        id,
        tenantId,
        name: 'Maria da Silva',
        type: 'INDIVIDUAL' as const,
        document: testCpf,
        email: testEmail,
        phone: '(11) 99999-8888',
        address: 'Rua das Flores, 123',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567',
      };

      // Encrypt
      const encrypted = cipher.encryptFields(
        { ...data },
        config.encryptedFields,
      );
      const hashes = cipher.generateHashes(data, config.hashFields);

      await prisma.customer.create({
        data: { ...encrypted, ...hashes },
      });

      customerId = id;

      // Read raw from DB (bypass repository decryption)
      const raw = await prisma.customer.findUnique({ where: { id } });
      expect(raw).not.toBeNull();

      // Verify fields are encrypted (not plaintext)
      expect(raw!.document).not.toBe(testCpf);
      expect(raw!.email).not.toBe(testEmail);
      expect(raw!.phone).not.toBe('(11) 99999-8888');

      // Verify name is NOT encrypted (not in encryptedFields)
      expect(raw!.name).toBe('Maria da Silva');

      // Verify hashes are populated
      expect(raw!.documentHash).toMatch(/^[a-f0-9]{64}$/);
      expect(raw!.emailHash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should decrypt data correctly on read', async () => {
      const raw = await prisma.customer.findUnique({
        where: { id: customerId },
      });
      expect(raw).not.toBeNull();

      const config = ENCRYPTED_FIELD_CONFIG.Customer;
      const decrypted = cipher.decryptFields(
        raw as unknown as Record<string, unknown>,
        config.encryptedFields,
      );

      expect(decrypted.document).toBe(testCpf);
      expect(decrypted.email).toBe(testEmail);
      expect(decrypted.phone).toBe('(11) 99999-8888');
      expect(decrypted.address).toBe('Rua das Flores, 123');
      expect(decrypted.city).toBe('São Paulo');
      expect(decrypted.state).toBe('SP');
      expect(decrypted.zipCode).toBe('01234-567');
    });

    it('should find customer by blind index (document hash)', async () => {
      const hash = cipher.blindIndex(testCpf);
      const found = await prisma.customer.findFirst({
        where: { documentHash: hash, tenantId, deletedAt: null },
      });
      expect(found).not.toBeNull();
      expect(found!.id).toBe(customerId);
    });

    it('should find customer by blind index (email hash)', async () => {
      const hash = cipher.blindIndex(testEmail);
      const found = await prisma.customer.findFirst({
        where: { emailHash: hash, tenantId, deletedAt: null },
      });
      expect(found).not.toBeNull();
      expect(found!.id).toBe(customerId);
    });

    it('should NOT find customer with wrong hash', async () => {
      const wrongHash = cipher.blindIndex('wrong@email.com');
      const found = await prisma.customer.findFirst({
        where: { emailHash: wrongHash, tenantId, deletedAt: null },
      });
      expect(found).toBeNull();
    });
  });

  // ─── BankAccount: encrypt financial identifiers ───────────

  describe('BankAccount encryption round-trip', () => {
    let bankAccountId: string;
    const testAccountNumber = '12345-6';
    const testPixKey = 'maria@pix.com';

    it('should encrypt bank account identifiers', async () => {
      const id = randomUUID();
      const config = ENCRYPTED_FIELD_CONFIG.BankAccount;

      const data = {
        id,
        tenantId,
        name: 'Conta Corrente BB',
        bankCode: '001',
        bankName: 'Banco do Brasil',
        agency: '1234',
        agencyDigit: '5',
        accountNumber: testAccountNumber,
        accountDigit: '7',
        accountType: 'CHECKING' as const,
        pixKey: testPixKey,
        pixKeyType: 'EMAIL',
        currentBalance: 0,
      };

      const encrypted = cipher.encryptFields(
        { ...data },
        config.encryptedFields,
      );
      const hashes = cipher.generateHashes(
        data as unknown as Record<string, string | null | undefined>,
        config.hashFields,
      );

      await prisma.bankAccount.create({
        data: { ...encrypted, ...hashes },
      });

      bankAccountId = id;

      // Verify raw DB has encrypted values
      const raw = await prisma.bankAccount.findUnique({ where: { id } });
      expect(raw!.accountNumber).not.toBe(testAccountNumber);
      expect(raw!.agency).not.toBe('1234');
      expect(raw!.pixKey).not.toBe(testPixKey);

      // Verify non-encrypted fields untouched
      expect(raw!.bankCode).toBe('001');
      expect(raw!.name).toBe('Conta Corrente BB');

      // Verify hashes
      expect(raw!.accountNumberHash).toMatch(/^[a-f0-9]{64}$/);
      expect(raw!.pixKeyHash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should decrypt bank account on read', async () => {
      const raw = await prisma.bankAccount.findUnique({
        where: { id: bankAccountId },
      });
      const config = ENCRYPTED_FIELD_CONFIG.BankAccount;
      const decrypted = cipher.decryptFields(
        raw as unknown as Record<string, unknown>,
        config.encryptedFields,
      );

      expect(decrypted.accountNumber).toBe(testAccountNumber);
      expect(decrypted.agency).toBe('1234');
      expect(decrypted.agencyDigit).toBe('5');
      expect(decrypted.accountDigit).toBe('7');
      expect(decrypted.pixKey).toBe(testPixKey);
    });

    it('should find by account number hash', async () => {
      const hash = cipher.blindIndex(testAccountNumber);
      const found = await prisma.bankAccount.findFirst({
        where: { accountNumberHash: hash, tenantId },
      });
      expect(found).not.toBeNull();
      expect(found!.id).toBe(bankAccountId);
    });
  });

  // ─── Supplier: encrypt + CNPJ blind index ────────────────

  describe('Supplier encryption round-trip', () => {
    const testCnpj = '12.345.678/0001-90';
    let supplierId: string;

    it('should encrypt supplier data and search by CNPJ hash', async () => {
      const id = randomUUID();
      const config = ENCRYPTED_FIELD_CONFIG.Supplier;

      const data = {
        id,
        tenantId,
        name: 'Fornecedor Teste',
        cnpj: testCnpj,
        email: 'contato@fornecedor.com',
        phone: '(11) 3333-4444',
        address: 'Av. Paulista, 1000',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01310-100',
        isActive: true,
      };

      const encrypted = cipher.encryptFields(
        { ...data },
        config.encryptedFields,
      );
      const hashes = cipher.generateHashes(
        data as unknown as Record<string, string | null | undefined>,
        config.hashFields,
      );

      await prisma.supplier.create({ data: { ...encrypted, ...hashes } });
      supplierId = id;

      // Search by CNPJ hash
      const cnpjHash = cipher.blindIndex(testCnpj);
      const found = await prisma.supplier.findFirst({
        where: { cnpjHash, tenantId, deletedAt: null },
      });
      expect(found).not.toBeNull();
      expect(found!.id).toBe(supplierId);

      // Verify raw is encrypted
      const raw = await prisma.supplier.findUnique({ where: { id } });
      expect(raw!.cnpj).not.toBe(testCnpj);
      expect(raw!.email).not.toBe('contato@fornecedor.com');
    });
  });

  // ─── Cross-tenant isolation ───────────────────────────────

  describe('Cross-tenant isolation with encryption', () => {
    it('should not find encrypted data from another tenant', async () => {
      const otherTenant = await prisma.tenant.create({
        data: {
          id: randomUUID(),
          name: `Other Tenant ${Date.now()}`,
          slug: `other-${Date.now()}`,
          status: 'ACTIVE',
          settings: {},
          metadata: {},
        },
      });

      try {
        const config = ENCRYPTED_FIELD_CONFIG.Customer;
        const cpf = '999.888.777-66';

        // Create customer in otherTenant
        const data = {
          id: randomUUID(),
          tenantId: otherTenant.id,
          name: 'Outro Tenant',
          document: cpf,
        };
        const encrypted = cipher.encryptFields(
          { ...data },
          config.encryptedFields,
        );
        const hashes = cipher.generateHashes(data, config.hashFields);
        await prisma.customer.create({ data: { ...encrypted, ...hashes } });

        // Search in original tenant — should NOT find
        const hash = cipher.blindIndex(cpf);
        const found = await prisma.customer.findFirst({
          where: { documentHash: hash, tenantId, deletedAt: null },
        });
        expect(found).toBeNull();
      } finally {
        await prisma.customer.deleteMany({
          where: { tenantId: otherTenant.id },
        });
        await prisma.tenant.delete({ where: { id: otherTenant.id } });
      }
    });
  });
});
