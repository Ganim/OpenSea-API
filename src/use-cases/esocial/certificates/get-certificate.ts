import { EsocialCertificate } from '@/entities/esocial/esocial-certificate';
import type { EsocialCertificatesRepository } from '@/repositories/esocial/esocial-certificates-repository';

export interface GetCertificateRequest {
  tenantId: string;
}

export interface GetCertificateResponse {
  certificate: EsocialCertificate | null;
}

/**
 * Get the current eSocial certificate for a tenant.
 * Returns null if no certificate has been uploaded.
 */
export class GetCertificateUseCase {
  constructor(
    private certificatesRepository: EsocialCertificatesRepository,
  ) {}

  async execute(
    request: GetCertificateRequest,
  ): Promise<GetCertificateResponse> {
    const certificate = await this.certificatesRepository.findByTenantId(
      request.tenantId,
    );

    return { certificate };
  }
}
