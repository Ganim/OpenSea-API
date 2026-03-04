import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

export class FieldCipherService {
  private readonly encryptionKey: Buffer;
  private readonly hmacKey: string;

  constructor(encryptionKeyHex: string, hmacKey: string) {
    this.encryptionKey = Buffer.from(encryptionKeyHex, 'hex');
    if (this.encryptionKey.length !== 32) {
      throw new Error('FIELD_ENCRYPTION_KEY must be 32 bytes (64 hex chars)');
    }
    if (!hmacKey || hmacKey.length < 16) {
      throw new Error('FIELD_HMAC_KEY must be at least 16 characters');
    }
    this.hmacKey = hmacKey;
  }

  /**
   * Encrypts a plaintext string.
   * Returns base64(IV + AuthTag + Ciphertext).
   */
  encrypt(plaintext: string): string {
    if (!plaintext) {
      throw new Error('Cannot encrypt empty value');
    }

    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.encryptionKey, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return Buffer.concat([iv, authTag, encrypted]).toString('base64');
  }

  /**
   * Decrypts a ciphertext produced by encrypt().
   */
  decrypt(ciphertext: string): string {
    if (!ciphertext) {
      throw new Error('Cannot decrypt empty value');
    }

    const packed = Buffer.from(ciphertext, 'base64');

    if (packed.length < IV_LENGTH + TAG_LENGTH + 1) {
      throw new Error('Invalid ciphertext: too short');
    }

    const iv = packed.subarray(0, IV_LENGTH);
    const authTag = packed.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encrypted = packed.subarray(IV_LENGTH + TAG_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, this.encryptionKey, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString('utf8');
  }

  /**
   * Generates a deterministic blind index (HMAC-SHA256) for equality search.
   * Same input always produces the same hash — enables WHERE cpf_hash = ? queries.
   */
  blindIndex(value: string): string {
    if (!value) {
      throw new Error('Cannot generate blind index for empty value');
    }
    return createHmac('sha256', this.hmacKey)
      .update(value.toLowerCase().trim())
      .digest('hex');
  }

  /**
   * Encrypts specified fields of an object in-place (returns new object).
   * Skips null/undefined values. Only encrypts string values.
   */
  encryptFields<T extends Record<string, unknown>>(
    obj: T,
    fieldNames: readonly string[],
  ): T {
    const result = { ...obj };
    for (const field of fieldNames) {
      const value = result[field];
      if (value === null || value === undefined) continue;
      if (typeof value !== 'string') continue;
      (result as Record<string, unknown>)[field] = this.encrypt(value);
    }
    return result;
  }

  /**
   * Decrypts specified fields of an object (returns new object).
   * Skips null/undefined values.
   */
  decryptFields<T extends Record<string, unknown>>(
    obj: T,
    fieldNames: readonly string[],
  ): T {
    const result = { ...obj };
    for (const field of fieldNames) {
      const value = result[field];
      if (value === null || value === undefined) continue;
      if (typeof value !== 'string') continue;
      try {
        (result as Record<string, unknown>)[field] = this.decrypt(value);
      } catch {
        // If decryption fails, the value might be plaintext (pre-migration data).
        // Leave it as-is to avoid breaking reads during migration.
      }
    }
    return result;
  }

  /**
   * Generates blind index hashes for specified fields.
   * fieldMap: { sourceField: 'hashColumnName' } e.g. { cpf: 'cpfHash' }
   */
  generateHashes(
    obj: Record<string, string | null | undefined>,
    fieldMap: Record<string, string>,
  ): Record<string, string | null> {
    const hashes: Record<string, string | null> = {};
    for (const [sourceField, hashColumn] of Object.entries(fieldMap)) {
      const value = obj[sourceField];
      hashes[hashColumn] = value ? this.blindIndex(value) : null;
    }
    return hashes;
  }

  /**
   * Checks if a value looks like it's already encrypted (base64 with correct prefix length).
   * Used during data migration to avoid double-encrypting.
   */
  isEncrypted(value: string): boolean {
    if (!value) return false;
    try {
      const buf = Buffer.from(value, 'base64');
      // Must be at least IV + TAG + 1 byte of ciphertext
      // and the base64 round-trip must be lossless
      return (
        buf.length >= IV_LENGTH + TAG_LENGTH + 1 &&
        buf.toString('base64') === value
      );
    } catch {
      return false;
    }
  }
}

// Singleton factory
let instance: FieldCipherService | null = null;

export function getFieldCipherService(): FieldCipherService {
  if (!instance) {
    const encKey = process.env.FIELD_ENCRYPTION_KEY;
    const hmacKey = process.env.FIELD_HMAC_KEY;

    if (!encKey || !hmacKey) {
      throw new Error(
        'FIELD_ENCRYPTION_KEY and FIELD_HMAC_KEY environment variables are required',
      );
    }

    instance = new FieldCipherService(encKey, hmacKey);
  }
  return instance;
}

/**
 * Resets the singleton instance. Used only in tests.
 */
export function resetFieldCipherService(): void {
  instance = null;
}
