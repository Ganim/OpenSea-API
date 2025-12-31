import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  CompanyFiscalSettingsProps,
  DigitalCertificateType,
  NfeEnvironment,
} from '@/entities/hr/company-fiscal-settings';
import type { CompanyFiscalSettings as PrismaCompanyFiscalSettings } from '@prisma/client';

export function mapCompanyFiscalSettingsPrismaToDomain(
  raw: PrismaCompanyFiscalSettings,
): CompanyFiscalSettingsProps {
  return {
    companyId: new UniqueEntityID(raw.companyId),
    nfeEnvironment: (raw.nfeEnvironment as NfeEnvironment) ?? undefined,
    nfeSeries: raw.nfeSeries ?? undefined,
    nfeLastNumber: raw.nfeLastNumber ?? undefined,
    nfeDefaultOperationNature: raw.nfeDefaultOperationNature ?? undefined,
    nfeDefaultCfop: raw.nfeDefaultCfop ?? undefined,
    digitalCertificateType:
      (raw.digitalCertificateType as DigitalCertificateType) ?? 'NONE',
    certificateA1PfxBlob: raw.certificateA1PfxBlob
      ? Buffer.from(raw.certificateA1PfxBlob)
      : undefined,
    certificateA1Password: raw.certificateA1Password ?? undefined,
    certificateA1ExpiresAt: raw.certificateA1ExpiresAt ?? undefined,
    nfceEnabled: raw.nfceEnabled ?? false,
    nfceCscId: raw.nfceCscId ?? undefined,
    nfceCscToken: raw.nfceCscToken ?? undefined,
    defaultTaxProfileId: raw.defaultTaxProfileId
      ? new UniqueEntityID(raw.defaultTaxProfileId)
      : undefined,
    metadata: (raw.metadata as Record<string, unknown>) ?? {},
    pendingIssues: (raw.pendingIssues as string[] | null) ?? [],
    deletedAt: raw.deletedAt ?? undefined,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}
