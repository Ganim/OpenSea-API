import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FiscalCertificate } from '@/entities/fiscal/fiscal-certificate';
import type { FiscalCertificatesRepository } from '@/repositories/fiscal/fiscal-certificates-repository';
import type { FiscalConfigsRepository } from '@/repositories/fiscal/fiscal-configs-repository';

interface UploadCertificateUseCaseRequest {
  tenantId: string;
  pfxBuffer: Buffer;
  pfxPassword: string;
  /** Pre-parsed certificate metadata (in production, parse from PFX) */
  serialNumber: string;
  issuer: string;
  subject: string;
  validFrom: Date;
  validUntil: Date;
}

interface UploadCertificateUseCaseResponse {
  certificate: FiscalCertificate;
}

export class UploadCertificateUseCase {
  constructor(
    private fiscalCertificatesRepository: FiscalCertificatesRepository,
    private fiscalConfigsRepository: FiscalConfigsRepository,
  ) {}

  async execute(
    request: UploadCertificateUseCaseRequest,
  ): Promise<UploadCertificateUseCaseResponse> {
    if (new Date(request.validUntil) <= new Date()) {
      throw new BadRequestError(
        'The certificate has already expired. Please upload a valid certificate.',
      );
    }

    const certificate = FiscalCertificate.create({
      tenantId: new UniqueEntityID(request.tenantId),
      pfxData: request.pfxBuffer,
      pfxPassword: request.pfxPassword,
      serialNumber: request.serialNumber,
      issuer: request.issuer,
      subject: request.subject,
      validFrom: request.validFrom,
      validUntil: request.validUntil,
    });

    await this.fiscalCertificatesRepository.create(certificate);

    // Automatically link certificate to fiscal config if one exists
    const fiscalConfig = await this.fiscalConfigsRepository.findByTenantId(
      request.tenantId,
    );

    if (fiscalConfig) {
      fiscalConfig.certificateId = certificate.id;
      await this.fiscalConfigsRepository.save(fiscalConfig);
    }

    return { certificate };
  }
}
