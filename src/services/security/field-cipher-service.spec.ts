import { beforeEach, describe, expect, it } from 'vitest';
import { FieldCipherService } from './field-cipher-service';

// Valid 256-bit key (64 hex chars)
const TEST_KEY =
  'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2';
const TEST_HMAC_KEY = 'test-hmac-key-minimum-16-chars';

describe('FieldCipherService', () => {
  let sut: FieldCipherService;

  beforeEach(() => {
    sut = new FieldCipherService(TEST_KEY, TEST_HMAC_KEY);
  });

  // ─── Constructor Validation ──────────────────────────

  describe('constructor', () => {
    it('should create instance with valid keys', () => {
      expect(sut).toBeInstanceOf(FieldCipherService);
    });

    it('should reject encryption key shorter than 32 bytes', () => {
      expect(() => new FieldCipherService('abcdef', TEST_HMAC_KEY)).toThrow(
        'FIELD_ENCRYPTION_KEY must be 32 bytes',
      );
    });

    it('should reject HMAC key shorter than 16 chars', () => {
      expect(() => new FieldCipherService(TEST_KEY, 'short')).toThrow(
        'FIELD_HMAC_KEY must be at least 16 characters',
      );
    });
  });

  // ─── Encrypt / Decrypt Round-Trip ────────────────────

  describe('encrypt / decrypt', () => {
    it('should round-trip a simple string', () => {
      const plaintext = '123.456.789-00';
      const encrypted = sut.encrypt(plaintext);
      const decrypted = sut.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should round-trip unicode text', () => {
      const plaintext = 'João da Silva — São Paulo/SP';
      const encrypted = sut.encrypt(plaintext);
      expect(sut.decrypt(encrypted)).toBe(plaintext);
    });

    it('should round-trip a long string (address)', () => {
      const plaintext =
        'Rua das Flores, 1234, Bloco A, Apt 501, Jardim Primavera';
      const encrypted = sut.encrypt(plaintext);
      expect(sut.decrypt(encrypted)).toBe(plaintext);
    });

    it('should produce different ciphertexts for same input (random IV)', () => {
      const plaintext = '123.456.789-00';
      const a = sut.encrypt(plaintext);
      const b = sut.encrypt(plaintext);
      expect(a).not.toBe(b);
      // But both decrypt to the same value
      expect(sut.decrypt(a)).toBe(plaintext);
      expect(sut.decrypt(b)).toBe(plaintext);
    });

    it('should reject empty plaintext', () => {
      expect(() => sut.encrypt('')).toThrow('Cannot encrypt empty value');
    });

    it('should reject empty ciphertext', () => {
      expect(() => sut.decrypt('')).toThrow('Cannot decrypt empty value');
    });

    it('should reject invalid ciphertext (too short)', () => {
      expect(() => sut.decrypt('AAAA')).toThrow('Invalid ciphertext');
    });

    it('should reject ciphertext encrypted with a different key', () => {
      const otherKey =
        'f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9e0d1c2b3a4f5e6d7c8b9a0f1e2';
      const other = new FieldCipherService(otherKey, TEST_HMAC_KEY);
      const encrypted = other.encrypt('secret');
      expect(() => sut.decrypt(encrypted)).toThrow();
    });
  });

  // ─── Blind Index ─────────────────────────────────────

  describe('blindIndex', () => {
    it('should produce a deterministic 64-char hex hash', () => {
      const hash = sut.blindIndex('123.456.789-00');
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should produce the same hash for the same input', () => {
      const a = sut.blindIndex('123.456.789-00');
      const b = sut.blindIndex('123.456.789-00');
      expect(a).toBe(b);
    });

    it('should produce different hashes for different inputs', () => {
      const a = sut.blindIndex('123.456.789-00');
      const b = sut.blindIndex('987.654.321-00');
      expect(a).not.toBe(b);
    });

    it('should normalize input (lowercase + trim)', () => {
      const a = sut.blindIndex('  Test@Email.COM  ');
      const b = sut.blindIndex('test@email.com');
      expect(a).toBe(b);
    });

    it('should reject empty value', () => {
      expect(() => sut.blindIndex('')).toThrow(
        'Cannot generate blind index for empty value',
      );
    });

    it('should produce different hashes with different HMAC keys', () => {
      const other = new FieldCipherService(TEST_KEY, 'different-hmac-key-1234');
      const a = sut.blindIndex('test');
      const b = other.blindIndex('test');
      expect(a).not.toBe(b);
    });
  });

  // ─── encryptFields ──────────────────────────────────

  describe('encryptFields', () => {
    it('should encrypt specified fields', () => {
      const obj = { cpf: '123.456.789-00', name: 'João', rg: '12345678' };
      const result = sut.encryptFields(obj, ['cpf', 'rg']);

      expect(result.cpf).not.toBe('123.456.789-00');
      expect(result.rg).not.toBe('12345678');
      expect(result.name).toBe('João'); // untouched
    });

    it('should skip null fields', () => {
      const obj = { cpf: null as string | null, name: 'João' };
      const result = sut.encryptFields(obj, ['cpf']);
      expect(result.cpf).toBeNull();
    });

    it('should skip undefined fields', () => {
      const obj = { name: 'João' } as Record<string, unknown>;
      const result = sut.encryptFields(obj, ['cpf']);
      expect(result.cpf).toBeUndefined();
    });

    it('should not modify the original object', () => {
      const obj = { cpf: '123.456.789-00' };
      sut.encryptFields(obj, ['cpf']);
      expect(obj.cpf).toBe('123.456.789-00');
    });
  });

  // ─── decryptFields ──────────────────────────────────

  describe('decryptFields', () => {
    it('should decrypt specified fields', () => {
      const original = { cpf: '123.456.789-00', rg: '12345678', name: 'João' };
      const encrypted = sut.encryptFields(original, ['cpf', 'rg']);
      const decrypted = sut.decryptFields(encrypted, ['cpf', 'rg']);

      expect(decrypted.cpf).toBe('123.456.789-00');
      expect(decrypted.rg).toBe('12345678');
      expect(decrypted.name).toBe('João');
    });

    it('should skip null fields', () => {
      const obj = { cpf: null as string | null };
      const result = sut.decryptFields(obj, ['cpf']);
      expect(result.cpf).toBeNull();
    });

    it('should leave plaintext values as-is (graceful degradation)', () => {
      const obj = { cpf: '123.456.789-00' }; // not encrypted
      const result = sut.decryptFields(obj, ['cpf']);
      // Should not throw — graceful fallback for pre-migration data
      expect(result.cpf).toBe('123.456.789-00');
    });
  });

  // ─── generateHashes ─────────────────────────────────

  describe('generateHashes', () => {
    it('should generate hashes for specified fields', () => {
      const obj = { cpf: '123.456.789-00', email: 'test@example.com' };
      const hashes = sut.generateHashes(obj, {
        cpf: 'cpfHash',
        email: 'emailHash',
      });

      expect(hashes.cpfHash).toMatch(/^[a-f0-9]{64}$/);
      expect(hashes.emailHash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should return null for null source fields', () => {
      const obj = { cpf: null as string | null };
      const hashes = sut.generateHashes(obj, { cpf: 'cpfHash' });
      expect(hashes.cpfHash).toBeNull();
    });

    it('should return null for undefined source fields', () => {
      const obj = {} as Record<string, string | undefined>;
      const hashes = sut.generateHashes(obj, { cpf: 'cpfHash' });
      expect(hashes.cpfHash).toBeNull();
    });

    it('should produce hashes matching blindIndex()', () => {
      const obj = { cpf: '123.456.789-00' };
      const hashes = sut.generateHashes(obj, { cpf: 'cpfHash' });
      expect(hashes.cpfHash).toBe(sut.blindIndex('123.456.789-00'));
    });
  });

  // ─── isEncrypted ────────────────────────────────────

  describe('isEncrypted', () => {
    it('should return true for encrypted values', () => {
      const encrypted = sut.encrypt('test');
      expect(sut.isEncrypted(encrypted)).toBe(true);
    });

    it('should return false for plaintext CPF', () => {
      expect(sut.isEncrypted('123.456.789-00')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(sut.isEncrypted('')).toBe(false);
    });

    it('should return false for short base64 string', () => {
      expect(sut.isEncrypted('AAAA')).toBe(false);
    });
  });

  // ─── Full round-trip scenario ───────────────────────

  describe('full round-trip (encrypt + hash + decrypt)', () => {
    it('should encrypt, generate hash, then decrypt back to original', () => {
      const original = {
        cpf: '123.456.789-00',
        rg: '12.345.678-9',
        name: 'Maria da Silva',
        email: null as string | null,
      };

      // Step 1: Encrypt fields
      const encrypted = sut.encryptFields(original, ['cpf', 'rg']);

      // Step 2: Generate hashes (on ORIGINAL values, before encryption)
      const hashes = sut.generateHashes(original, {
        cpf: 'cpfHash',
      });

      // Step 3: Verify encrypted values are different from original
      expect(encrypted.cpf).not.toBe(original.cpf);
      expect(encrypted.rg).not.toBe(original.rg);
      expect(encrypted.name).toBe(original.name); // untouched
      expect(encrypted.email).toBeNull(); // null stays null

      // Step 4: Verify hash is deterministic
      expect(hashes.cpfHash).toBe(sut.blindIndex('123.456.789-00'));

      // Step 5: Decrypt and verify
      const decrypted = sut.decryptFields(encrypted, ['cpf', 'rg']);
      expect(decrypted.cpf).toBe('123.456.789-00');
      expect(decrypted.rg).toBe('12.345.678-9');
      expect(decrypted.name).toBe('Maria da Silva');
    });
  });
});
