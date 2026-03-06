import { env } from '@/@env';
import crypto from 'node:crypto';

interface DecryptionPayload {
  v?: number; // version (undefined = legacy, 1 = current)
  iv: string;
  tag: string;
  content: string;
}

const CURRENT_VERSION = 1;

export class CredentialCipherService {
  private readonly key: Buffer;

  constructor() {
    this.key = this.resolveKey();
  }

  encrypt(plainText: string): string {
    if (!plainText) {
      throw new Error('Credential text is required');
    }

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);

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

  decrypt(encryptedText: string): string {
    if (!encryptedText) {
      throw new Error('Encrypted credential is required');
    }

    let payload: DecryptionPayload;

    try {
      const rawPayload = Buffer.from(encryptedText, 'base64').toString('utf8');
      payload = JSON.parse(rawPayload) as DecryptionPayload;
    } catch {
      throw new Error('Invalid encrypted credential payload');
    }

    const iv = Buffer.from(payload.iv, 'base64');
    const tag = Buffer.from(payload.tag, 'base64');
    const content = Buffer.from(payload.content, 'base64');

    const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(tag);

    let decrypted: Buffer;
    try {
      decrypted = Buffer.concat([
        decipher.update(content),
        decipher.final(),
      ]);
    } catch {
      throw new Error('Failed to decrypt credential');
    }

    return decrypted.toString('utf8');
  }

  private resolveKey(): Buffer {
    const key = env.EMAIL_CREDENTIALS_KEY;

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
