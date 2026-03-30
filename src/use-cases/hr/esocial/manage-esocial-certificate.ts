import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { prisma } from '@/lib/prisma';
import { CertificateManager } from '@/services/esocial/crypto/certificate-manager';
import { env } from '@/@env';

export interface UploadCertificateRequest {
  tenantId: string;
  pfxBuffer: Buffer;
  passphrase: string;
}

export interface CertificateResponse {
  certificate: {
    id: string;
    serialNumber: string;
    issuer: string;
    subject: string;
    validFrom: string;
    validUntil: string;
    daysLeft: number;
    isExpired: boolean;
    createdAt: string;
  };
}

export interface GetCertificateRequest {
  tenantId: string;
}

export class UploadEsocialCertificateUseCase {
  private certManager = new CertificateManager();

  async execute(
    request: UploadCertificateRequest,
  ): Promise<CertificateResponse> {
    const { tenantId, pfxBuffer, passphrase } = request;

    // 1. Parse PFX to extract certificate info
    const certInfo = await this.certManager.parsePfx(pfxBuffer, passphrase);

    // 2. Check if certificate is already expired
    if (this.certManager.isExpired(certInfo.validUntil)) {
      throw new BadRequestError('O certificado enviado já está expirado.');
    }

    // 3. Encrypt PFX for secure storage
    const encryptionKey = env.ESOCIAL_ENCRYPTION_KEY || env.JWT_SECRET;
    const encrypted = await this.certManager.encrypt(pfxBuffer, encryptionKey);

    // 4. Upsert certificate record
    const certificate = await prisma.esocialCertificate.upsert({
      where: { tenantId },
      create: {
        tenantId,
        encryptedPfx: encrypted.encrypted,
        encryptionIv: encrypted.iv,
        encryptionTag: encrypted.authTag,
        serialNumber: certInfo.serialNumber,
        issuer: certInfo.issuer,
        subject: certInfo.subject,
        validFrom: certInfo.validFrom,
        validUntil: certInfo.validUntil,
      },
      update: {
        encryptedPfx: encrypted.encrypted,
        encryptionIv: encrypted.iv,
        encryptionTag: encrypted.authTag,
        serialNumber: certInfo.serialNumber,
        issuer: certInfo.issuer,
        subject: certInfo.subject,
        validFrom: certInfo.validFrom,
        validUntil: certInfo.validUntil,
      },
    });

    return {
      certificate: {
        id: certificate.id,
        serialNumber: certificate.serialNumber,
        issuer: certificate.issuer,
        subject: certificate.subject,
        validFrom: certificate.validFrom.toISOString(),
        validUntil: certificate.validUntil.toISOString(),
        daysLeft: this.certManager.daysUntilExpiry(certificate.validUntil),
        isExpired: this.certManager.isExpired(certificate.validUntil),
        createdAt: certificate.createdAt.toISOString(),
      },
    };
  }
}

export class GetEsocialCertificateUseCase {
  private certManager = new CertificateManager();

  async execute(
    request: GetCertificateRequest,
  ): Promise<CertificateResponse | null> {
    const { tenantId } = request;

    const certificate = await prisma.esocialCertificate.findUnique({
      where: { tenantId },
    });

    if (!certificate) {
      return null;
    }

    return {
      certificate: {
        id: certificate.id,
        serialNumber: certificate.serialNumber,
        issuer: certificate.issuer,
        subject: certificate.subject,
        validFrom: certificate.validFrom.toISOString(),
        validUntil: certificate.validUntil.toISOString(),
        daysLeft: this.certManager.daysUntilExpiry(certificate.validUntil),
        isExpired: this.certManager.isExpired(certificate.validUntil),
        createdAt: certificate.createdAt.toISOString(),
      },
    };
  }
}
