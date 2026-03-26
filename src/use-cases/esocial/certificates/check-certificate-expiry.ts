import type { EsocialCertificatesRepository } from '@/repositories/esocial/esocial-certificates-repository';

export interface CheckCertificateExpiryRequest {
  tenantId: string;
  warningDays?: number; // Default 30
}

export interface CheckCertificateExpiryResponse {
  hasCertificate: boolean;
  isExpired: boolean;
  isExpiringSoon: boolean;
  daysUntilExpiry: number | null;
  validUntil: Date | null;
}

/**
 * Check the expiry status of a tenant's eSocial certificate.
 */
export class CheckCertificateExpiryUseCase {
  constructor(
    private certificatesRepository: EsocialCertificatesRepository,
  ) {}

  async execute(
    request: CheckCertificateExpiryRequest,
  ): Promise<CheckCertificateExpiryResponse> {
    const certificate = await this.certificatesRepository.findByTenantId(
      request.tenantId,
    );

    if (!certificate) {
      return {
        hasCertificate: false,
        isExpired: false,
        isExpiringSoon: false,
        daysUntilExpiry: null,
        validUntil: null,
      };
    }

    const warningDays = request.warningDays ?? 30;

    return {
      hasCertificate: true,
      isExpired: certificate.isExpired(),
      isExpiringSoon: certificate.isExpiringSoon(warningDays),
      daysUntilExpiry: certificate.daysUntilExpiry(),
      validUntil: certificate.validUntil,
    };
  }
}
