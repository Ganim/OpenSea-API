import crypto from 'crypto';

export interface CertificateInfo {
  privateKey: string;
  certificate: string;
  serialNumber: string;
  issuer: string;
  subject: string;
  validFrom: Date;
  validUntil: Date;
}

export interface EncryptedData {
  encrypted: Buffer;
  iv: string;
  authTag: string;
}

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

/**
 * Certificate management service for eSocial.
 * Handles PFX parsing, encryption/decryption of stored certificates,
 * and expiry checks.
 */
export class CertificateManager {
  /**
   * Parse a PFX (PKCS#12) file to extract private key and certificate.
   * Uses Node.js native crypto module.
   */
  async parsePfx(
    pfxBuffer: Buffer,
    passphrase: string,
  ): Promise<CertificateInfo> {
    try {
      // Use forge for PFX parsing (more reliable than Node's native)
      const forge = await import('node-forge');

      const p12Asn1 = forge.asn1.fromDer(pfxBuffer.toString('binary'));
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, passphrase);

      // Extract certificate
      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const certBag = certBags[forge.pki.oids.certBag];
      if (!certBag || certBag.length === 0) {
        throw new Error('No certificate found in PFX file');
      }

      const cert = certBag[0]?.cert;
      if (!cert) {
        throw new Error('Failed to extract certificate from PFX');
      }

      // Extract private key
      const keyBags = p12.getBags({
        bagType: forge.pki.oids.pkcs8ShroudedKeyBag,
      });
      const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag];
      if (!keyBag || keyBag.length === 0) {
        throw new Error('No private key found in PFX file');
      }

      const key = keyBag[0]?.key;
      if (!key) {
        throw new Error('Failed to extract private key from PFX');
      }

      const privateKeyPem = forge.pki.privateKeyToPem(key);
      const certificatePem = forge.pki.certificateToPem(cert);

      return {
        privateKey: privateKeyPem,
        certificate: certificatePem,
        serialNumber: cert.serialNumber,
        issuer: cert.issuer.attributes
          .map((a) => `${a.shortName}=${a.value}`)
          .join(', '),
        subject: cert.subject.attributes
          .map((a) => `${a.shortName}=${a.value}`)
          .join(', '),
        validFrom: cert.validity.notBefore,
        validUntil: cert.validity.notAfter,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('PFX')) {
        throw error;
      }
      throw new Error(
        `Failed to parse PFX certificate: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Encrypt data using AES-256-GCM.
   * Used for securely storing PFX files in the database.
   */
  async encrypt(data: Buffer, key: string): Promise<EncryptedData> {
    const keyBuffer = this.deriveKey(key);
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  }

  /**
   * Decrypt data using AES-256-GCM.
   */
  async decrypt(
    encrypted: Buffer,
    key: string,
    iv: string,
    authTag: string,
  ): Promise<Buffer> {
    const keyBuffer = this.deriveKey(key);
    const ivBuffer = Buffer.from(iv, 'hex');
    const authTagBuffer = Buffer.from(authTag, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, ivBuffer);
    decipher.setAuthTag(authTagBuffer);

    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  }

  /**
   * Check if a certificate is expired.
   */
  isExpired(validUntil: Date): boolean {
    return new Date() > new Date(validUntil);
  }

  /**
   * Calculate the number of days until certificate expiry.
   */
  daysUntilExpiry(validUntil: Date): number {
    const now = new Date();
    const expiry = new Date(validUntil);
    const diff = expiry.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Derive a 32-byte key from a passphrase using PBKDF2.
   */
  private deriveKey(passphrase: string): Buffer {
    return crypto.pbkdf2Sync(
      passphrase,
      'opensea-esocial-salt',
      100000,
      32,
      'sha256',
    );
  }
}
