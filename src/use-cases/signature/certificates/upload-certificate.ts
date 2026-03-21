import type { DigitalCertificate } from '@/entities/signature/digital-certificate';
import type { DigitalCertificatesRepository } from '@/repositories/signature/digital-certificates-repository';

interface UploadCertificateUseCaseRequest {
  tenantId: string;
  name: string;
  type: string;
  subjectName?: string;
  subjectCnpj?: string;
  subjectCpf?: string;
  issuerName?: string;
  serialNumber?: string;
  validFrom?: Date;
  validUntil?: Date;
  thumbprint?: string;
  pfxFileId?: string;
  pfxPassword?: string;
  cloudProviderId?: string;
  alertDaysBefore?: number;
  isDefault?: boolean;
  allowedModules?: string[];
}

interface UploadCertificateUseCaseResponse {
  certificate: DigitalCertificate;
}

export class UploadCertificateUseCase {
  constructor(
    private digitalCertificatesRepository: DigitalCertificatesRepository,
  ) {}

  async execute(
    request: UploadCertificateUseCaseRequest,
  ): Promise<UploadCertificateUseCaseResponse> {
    const certificate = await this.digitalCertificatesRepository.create({
      tenantId: request.tenantId,
      name: request.name,
      type: request.type,
      subjectName: request.subjectName,
      subjectCnpj: request.subjectCnpj,
      subjectCpf: request.subjectCpf,
      issuerName: request.issuerName,
      serialNumber: request.serialNumber,
      validFrom: request.validFrom,
      validUntil: request.validUntil,
      thumbprint: request.thumbprint,
      pfxFileId: request.pfxFileId,
      pfxPassword: request.pfxPassword,
      cloudProviderId: request.cloudProviderId,
      alertDaysBefore: request.alertDaysBefore,
      isDefault: request.isDefault,
      allowedModules: request.allowedModules,
    });

    return { certificate };
  }
}
