import { env } from '@/@env';
import crypto from 'node:crypto';

interface DecryptionPayload {
  v?: number; // version (undefined = legacy, 1 = current)
  iv: string;
  tag: string;
  content: string;
}

const CURRENT_VERSION = 1;

export interface DecryptResult {
  plainText: string;
  /** true when decryption succeeded with the previous key — caller should re-encrypt */
  needsReEncrypt: boolean;
}

export class CredentialCipherService {
  private readonly key: Buffer;
  private readonly previousKey: Buffer | null;

  constructor() {
    this.key = this.resolveKey(env.EMAIL_CREDENTIALS_KEY);
    this.previousKey = env.EMAIL_CREDENTIALS_KEY_PREVIOUS
      ? this.resolveKey(env.EMAIL_CREDENTIALS_KEY_PREVIOUS)
      : null;
  }

  encrypt(plainText: string): string {
    if (!plainText) {
      throw new Error('Credential text is required');
    }

    return this.encryptWithKey(plainText, this.key);
  }

  /**
   * Decrypt with current key, falling back to previous key if configured.
   * When the previous key succeeds, `needsReEncrypt` is true so the caller
   * can persist the credential re-encrypted with the current key.
   */
  decryptWithRotation(encryptedText: string): DecryptResult {
    if (!encryptedText) {
      throw new Error('Encrypted credential is required');
    }

    const payload = this.parsePayload(encryptedText);

    // Try current key first
    try {
      const plainText = this.decryptPayload(payload, this.key);
      return { plainText, needsReEncrypt: false };
    } catch {
      // Current key failed — try previous if available
    }

    if (this.previousKey) {
      try {
        const plainText = this.decryptPayload(payload, this.previousKey);
        return { plainText, needsReEncrypt: true };
      } catch {
        // Previous key also failed
      }
    }

    throw new Error('Failed to decrypt credential with current or previous key');
  }

  /**
   * Simple decrypt (backward-compatible). Uses current key only.
   */
  decrypt(encryptedText: string): string {
    const result = this.decryptWithRotation(encryptedText);
    return result.plainText;
  }

  private encryptWithKey(plainText: string, key: Buffer): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    const encrypted = Buffer.concat([
      cipher.update(plainText, 'utf8'),
      cipher.final(),
    ]);

    const tag = cipher.getAuthTag();

    const payload: DecryptionPayload = {
      v: CURRENT_VERSION,
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
      content: encrypted.toString('base64'),
    };

    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  private parsePayload(encryptedText: string): DecryptionPayload {
    try {
      const rawPayload = Buffer.from(encryptedText, 'base64').toString('utf8');
      return JSON.parse(rawPayload) as DecryptionPayload;
    } catch {
      throw new Error('Invalid encrypted credential payload');
    }
  }

  private decryptPayload(payload: DecryptionPayload, key: Buffer): string {
    const iv = Buffer.from(payload.iv, 'base64');
    const tag = Buffer.from(payload.tag, 'base64');
    const content = Buffer.from(payload.content, 'base64');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(content),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }

  private resolveKey(key: string | undefined): Buffer {
    if (!key) {
      throw new Error('EMAIL_CREDENTIALS_KEY is not configured');
    }

    // Try base64-encoded 32-byte key
    const fromBase64 = this.tryDecodeBase64Key(key);
    if (fromBase64) {
      return fromBase64;
    }

    // Try raw 32-char key
    if (key.length === 32) {
      return Buffer.from(key, 'utf8');
    }

    throw new Error(
      'EMAIL_CREDENTIALS_KEY must be 32 chars raw or base64-encoded 32-byte key',
    );
  }

  private tryDecodeBase64Key(value: string): Buffer | null {
    try {
      const decoded = Buffer.from(value, 'base64');
      if (decoded.length === 32) {
        return decoded;
      }
      return null;
    } catch {
      return null;
    }
  }
}
