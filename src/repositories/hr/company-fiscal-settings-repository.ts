import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CompanyFiscalSettings } from '@/entities/hr/company-fiscal-settings';

export interface CreateCompanyFiscalSettingsSchema {
  companyId: UniqueEntityID;
  nfeEnvironment?: string;
  nfeSeries?: string;
  nfeLastNumber?: number;
  nfeDefaultOperationNature?: string;
  nfeDefaultCfop?: string;
  digitalCertificateType?: string;
  certificateA1PfxBlob?: Buffer;
  certificateA1Password?: string;
  certificateA1ExpiresAt?: Date;
  nfceEnabled?: boolean;
  nfceCscId?: string;
  nfceCscToken?: string;
  defaultTaxProfileId?: UniqueEntityID;
  pendingIssues?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateCompanyFiscalSettingsSchema {
  id: UniqueEntityID;
  companyId: UniqueEntityID;
  nfeEnvironment?: string | null;
  nfeSeries?: string | null;
  nfeLastNumber?: number | null;
  nfeDefaultOperationNature?: string | null;
  nfeDefaultCfop?: string | null;
  digitalCertificateType?: string;
  certificateA1PfxBlob?: Buffer | null;
  certificateA1Password?: string | null;
  certificateA1ExpiresAt?: Date | null;
  nfceEnabled?: boolean;
  nfceCscId?: string | null;
  nfceCscToken?: string | null;
  defaultTaxProfileId?: UniqueEntityID | null;
  pendingIssues?: string[];
  metadata?: Record<string, unknown>;
}

export interface CompanyFiscalSettingsRepository {
  create(
    data: CreateCompanyFiscalSettingsSchema,
  ): Promise<CompanyFiscalSettings>;
  findById(
    id: UniqueEntityID,
    options?: { companyId?: UniqueEntityID; includeDeleted?: boolean },
  ): Promise<CompanyFiscalSettings | null>;
  findByCompanyId(
    companyId: UniqueEntityID,
    options?: { includeDeleted?: boolean },
  ): Promise<CompanyFiscalSettings | null>;
  save(fiscalSettings: CompanyFiscalSettings): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
  softDelete(id: UniqueEntityID): Promise<void>;
}
