import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { EsocialCertificatesRepository } from '@/repositories/esocial/esocial-certificates-repository';

export interface DeleteCertificateRequest {
  tenantId: string;
}

/**
 * Delete the eSocial certificate for a tenant.
 */
export class DeleteCertificateUseCase {
  constructor(
    private certificatesRepository: EsocialCertificatesRepository,
  ) {}

  async execute(request: DeleteCertificateRequest): Promise<void> {
    const existing = await this.certificatesRepository.findByTenantId(
      request.tenantId,
    );

    if (!existing) {
      throw new ResourceNotFoundError('Certificate not found');
    }

    await this.certificatesRepository.delete(request.tenantId);
  }
}
