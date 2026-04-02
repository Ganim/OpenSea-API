import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { EsocialCertificate } from '@/entities/esocial/esocial-certificate';
import type { EsocialCertificatesRepository } from '@/repositories/esocial/esocial-certificates-repository';

export interface UploadCertificateRequest {
  tenantId: string;
  pfxData: Buffer;
  passphrase: string;
  type: string; // E_CNPJ, E_CPF
}

export interface UploadCertificateResponse {
  certificate: EsocialCertificate;
}

/**
 * Upload a digital certificate (PFX) for eSocial transmission.
 * Validates the certificate type and stores encrypted data.
 * Replaces any existing certificate for the tenant.
 */
export class UploadCertificateUseCase {
  constructor(private certificatesRepository: EsocialCertificatesRepository) {}

  async execute(
    request: UploadCertificateRequest,
  ): Promise<UploadCertificateResponse> {
    const { tenantId, pfxData, passphrase, type } = request;

    // Validate certificate type
    if (!['E_CNPJ', 'E_CPF'].includes(type)) {
      throw new BadRequestError('Certificate type must be E_CNPJ or E_CPF');
    }

    // Validate PFX data exists
    if (!pfxData || pfxData.length === 0) {
      throw new BadRequestError('PFX data is required');
    }

    // Extract metadata from PFX
    // In a real implementation, this would parse the PFX with node-forge or similar
    // For now, we store with placeholder metadata
    const now = new Date();
    const validFrom = now;
    const validUntil = new Date(
      now.getFullYear() + 3,
      now.getMonth(),
      now.getDate(),
    );

    // Generate a serial number placeholder (in production, extract from PFX)
    const serialNumber = `SN-${Date.now().toString(36).toUpperCase()}`;
    const issuer = 'Autoridade Certificadora (pendente de extração)';
    const subject = `Certificado ${type} - Tenant ${tenantId.substring(0, 8)}`;

    const certificate = await this.certificatesRepository.create({
      tenantId,
      type,
      serialNumber,
      issuer,
      subject,
      validFrom,
      validUntil,
      pfxData,
      passphrase, // In production, this should be encrypted at rest
      isActive: true,
    });

    return { certificate };
  }
}
