import type { CompanyFiscalSettings } from '@/entities/hr/company-fiscal-settings';

export interface CompanyFiscalSettingsDTO {
  id: string;
  companyId: string;
  nfeEnvironment?: string;
  nfeSeries?: string;
  nfeLastNumber?: number;
  nfeDefaultOperationNature?: string;
  nfeDefaultCfop?: string;
  digitalCertificateType: 'NONE' | 'A1' | 'A3';
  certificateA1ExpiresAt?: Date;
  nfceEnabled: boolean;
  defaultTaxProfileId?: string;
  metadata: Record<string, unknown>;
  pendingIssues: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface CompanyFiscalSettingsSensitiveDTO
  extends CompanyFiscalSettingsDTO {
  certificateA1Password?: string;
  nfceCscToken?: string;
}

/**
 * Converter para DTO público (sem dados sensíveis)
 */
export function companyFiscalSettingsToDTO(
  fiscalSettings: CompanyFiscalSettings,
): CompanyFiscalSettingsDTO {
  return {
    id: fiscalSettings.id.toString(),
    companyId: fiscalSettings.companyId.toString(),
    nfeEnvironment: fiscalSettings.nfeEnvironment,
    nfeSeries: fiscalSettings.nfeSeries,
    nfeLastNumber: fiscalSettings.nfeLastNumber,
    nfeDefaultOperationNature: fiscalSettings.nfeDefaultOperationNature,
    nfeDefaultCfop: fiscalSettings.nfeDefaultCfop,
    digitalCertificateType: fiscalSettings.digitalCertificateType as
      | 'NONE'
      | 'A1'
      | 'A3',
    certificateA1ExpiresAt: fiscalSettings.certificateA1ExpiresAt,
    nfceEnabled: fiscalSettings.nfceEnabled,
    defaultTaxProfileId: fiscalSettings.defaultTaxProfileId?.toString(),
    metadata: fiscalSettings.metadata,
    pendingIssues: fiscalSettings.pendingIssues,
    createdAt: fiscalSettings.createdAt,
    updatedAt: fiscalSettings.updatedAt,
    deletedAt: fiscalSettings.deletedAt,
  };
}

/**
 * Converter para DTO sensível (com dados sensíveis mascarados)
 * Retorna "[ENCRYPTED]" para dados sensíveis
 */
export function companyFiscalSettingsToSensitiveDTO(
  fiscalSettings: CompanyFiscalSettings,
): CompanyFiscalSettingsSensitiveDTO {
  const baseDTO = companyFiscalSettingsToDTO(fiscalSettings);

  return {
    ...baseDTO,
    certificateA1Password: fiscalSettings.certificateA1Password
      ? '[ENCRYPTED]'
      : undefined,
    nfceCscToken: fiscalSettings.nfceCscToken ? '[ENCRYPTED]' : undefined,
  };
}
