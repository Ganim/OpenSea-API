import forge from 'node-forge';

interface DecryptionPayload {
  iv: string;
  tag: string;
  content: string;
}

export class CredentialCipherService {
  private readonly key: string;

  constructor() {
    this.key = this.resolveKey();
  }

  encrypt(plainText: string): string {
    if (!plainText) {
      throw new Error('Credential text is required');
    }

    const iv = forge.random.getBytesSync(12);
    const cipher = forge.cipher.createCipher('AES-GCM', this.key);

    cipher.start({
      iv,
      tagLength: 128,
    });

    cipher.update(forge.util.createBuffer(plainText, 'utf8'));

    const finished = cipher.finish();

    if (!finished) {
      throw new Error('Failed to encrypt credential');
    }

    const payload: DecryptionPayload = {
      iv: forge.util.encode64(iv),
      tag: forge.util.encode64(cipher.mode.tag.getBytes()),
      content: forge.util.encode64(cipher.output.getBytes()),
    };

    return forge.util.encode64(JSON.stringify(payload));
  }

  decrypt(encryptedText: string): string {
    if (!encryptedText) {
      throw new Error('Encrypted credential is required');
    }

    let payload: DecryptionPayload;

    try {
      const rawPayload = forge.util.decode64(encryptedText);
      payload = JSON.parse(rawPayload) as DecryptionPayload;
    } catch {
      throw new Error('Invalid encrypted credential payload');
    }

    const decipher = forge.cipher.createDecipher('AES-GCM', this.key);

    decipher.start({
      iv: forge.util.decode64(payload.iv),
      tag: forge.util.createBuffer(forge.util.decode64(payload.tag)),
      tagLength: 128,
    });

    decipher.update(
      forge.util.createBuffer(forge.util.decode64(payload.content)),
    );

    const finished = decipher.finish();

    if (!finished) {
      throw new Error('Failed to decrypt credential');
    }

    return decipher.output.toString();
  }

  private resolveKey(): string {
    const key = process.env.EMAIL_CREDENTIALS_KEY;

    if (!key) {
      throw new Error('EMAIL_CREDENTIALS_KEY is not configured');
    }

    const fromBase64 = this.tryDecodeBase64Key(key);

    if (fromBase64) {
      return fromBase64;
    }

    if (key.length === 32) {
      return key;
    }

    throw new Error(
      'EMAIL_CREDENTIALS_KEY must be 32 chars raw or base64-encoded 32-byte key',
    );
  }

  private tryDecodeBase64Key(value: string): string | null {
    try {
      const decoded = forge.util.decode64(value);
      if (decoded.length === 32) {
        return decoded;
      }
      return null;
    } catch {
      return null;
    }
  }
}
