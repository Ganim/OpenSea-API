import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CompanyFiscalSettings } from '@/entities/hr/company-fiscal-settings';
import type { CompanyFiscalSettingsRepository } from '@/repositories/hr/company-fiscal-settings-repository';

export interface CreateCompanyFiscalSettingsRequest {
  companyId: string;
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
  defaultTaxProfileId?: string;
}

export interface CreateCompanyFiscalSettingsResponse {
  fiscalSettings: CompanyFiscalSettings;
}

export class CreateCompanyFiscalSettingsUseCase {
  constructor(
    private companyFiscalSettingsRepository: CompanyFiscalSettingsRepository,
  ) {}

  async execute(
    request: CreateCompanyFiscalSettingsRequest,
  ): Promise<CreateCompanyFiscalSettingsResponse> {
    const companyId = new UniqueEntityID(request.companyId);

    // Check if fiscal settings already exist for this company
    const existingFiscalSettings =
      await this.companyFiscalSettingsRepository.findByCompanyId(companyId, {
        includeDeleted: false,
      });

    if (existingFiscalSettings) {
      throw new BadRequestError(
        'Fiscal settings already exist for this company',
      );
    }

    const pendingIssues = this.computePendingIssues(request);

    const fiscalSettings = await this.companyFiscalSettingsRepository.create({
      companyId,
      nfeEnvironment: request.nfeEnvironment,
      nfeSeries: request.nfeSeries,
      nfeLastNumber: request.nfeLastNumber,
      nfeDefaultOperationNature: request.nfeDefaultOperationNature,
      nfeDefaultCfop: request.nfeDefaultCfop,
      digitalCertificateType: request.digitalCertificateType ?? 'NONE',
      certificateA1PfxBlob: request.certificateA1PfxBlob,
      certificateA1Password: request.certificateA1Password,
      certificateA1ExpiresAt: request.certificateA1ExpiresAt,
      nfceEnabled: request.nfceEnabled ?? false,
      nfceCscId: request.nfceCscId,
      nfceCscToken: request.nfceCscToken,
      defaultTaxProfileId: request.defaultTaxProfileId
        ? new UniqueEntityID(request.defaultTaxProfileId)
        : undefined,
      pendingIssues,
      metadata: {},
    });

    return { fiscalSettings };
  }

  private computePendingIssues(
    request: CreateCompanyFiscalSettingsRequest,
  ): string[] {
    const issues: string[] = [];

    // NF-e fields
    if (request.nfeEnvironment !== undefined && !request.nfeSeries) {
      issues.push('nfeSeries');
    }
    if (
      request.nfeEnvironment !== undefined &&
      request.nfeLastNumber === undefined
    ) {
      issues.push('nfeLastNumber');
    }
    if (
      request.nfeEnvironment !== undefined &&
      !request.nfeDefaultOperationNature
    ) {
      issues.push('nfeDefaultOperationNature');
    }
    if (request.nfeEnvironment !== undefined && !request.nfeDefaultCfop) {
      issues.push('nfeDefaultCfop');
    }

    // Digital certificate validations
    if (
      request.digitalCertificateType === 'A1' &&
      !request.certificateA1PfxBlob
    ) {
      issues.push('certificateA1PfxBlob');
    }
    if (
      request.digitalCertificateType === 'A1' &&
      !request.certificateA1Password
    ) {
      issues.push('certificateA1Password');
    }

    // NFC-e validations
    if (request.nfceEnabled && !request.nfceCscId) {
      issues.push('nfceCscId');
    }
    if (request.nfceEnabled && !request.nfceCscToken) {
      issues.push('nfceCscToken');
    }

    // NFC-e can only be enabled if certificate is not NONE
    if (request.nfceEnabled && request.digitalCertificateType === 'NONE') {
      issues.push('digitalCertificateType');
    }

    return issues;
  }
}
