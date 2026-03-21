import type { DigitalCertificate } from '@/entities/signature/digital-certificate';

export interface DigitalCertificateDTO {
  id: string;
  tenantId: string;
  name: string;
  type: string;
  status: string;
  subjectName: string | null;
  subjectCnpj: string | null;
  subjectCpf: string | null;
  issuerName: string | null;
  serialNumber: string | null;
  validFrom: Date | null;
  validUntil: Date | null;
  thumbprint: string | null;
  pfxFileId: string | null;
  cloudProviderId: string | null;
  alertDaysBefore: number;
  isDefault: boolean;
  allowedModules: string[];
  lastUsedAt: Date | null;
  isExpired: boolean;
  daysUntilExpiry: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export function digitalCertificateToDTO(
  cert: DigitalCertificate,
): DigitalCertificateDTO {
  return {
    id: cert.certificateId.toString(),
    tenantId: cert.tenantId.toString(),
    name: cert.name,
    type: cert.type,
    status: cert.status,
    subjectName: cert.subjectName,
    subjectCnpj: cert.subjectCnpj,
    subjectCpf: cert.subjectCpf,
    issuerName: cert.issuerName,
    serialNumber: cert.serialNumber,
    validFrom: cert.validFrom,
    validUntil: cert.validUntil,
    thumbprint: cert.thumbprint,
    pfxFileId: cert.pfxFileId,
    cloudProviderId: cert.cloudProviderId,
    alertDaysBefore: cert.alertDaysBefore,
    isDefault: cert.isDefault,
    allowedModules: cert.allowedModules,
    lastUsedAt: cert.lastUsedAt,
    isExpired: cert.isExpired,
    daysUntilExpiry: cert.daysUntilExpiry,
    createdAt: cert.createdAt,
    updatedAt: cert.updatedAt,
  };
}
