import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  CompanyFiscalSettings,
  type NfeEnvironment,
} from '@/entities/hr/company-fiscal-settings';
import type { CompanyFiscalSettingsRepository } from '@/repositories/hr/company-fiscal-settings-repository';

export interface UpdateCompanyFiscalSettingsRequest {
  companyId: string;
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
  defaultTaxProfileId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface UpdateCompanyFiscalSettingsResponse {
  fiscalSettings: CompanyFiscalSettings;
}

export class UpdateCompanyFiscalSettingsUseCase {
  constructor(
    private companyFiscalSettingsRepository: CompanyFiscalSettingsRepository,
  ) {}

  async execute(
    request: UpdateCompanyFiscalSettingsRequest,
  ): Promise<UpdateCompanyFiscalSettingsResponse> {
    const companyId = new UniqueEntityID(request.companyId);

    const fiscalSettings =
      await this.companyFiscalSettingsRepository.findByCompanyId(companyId);

    if (!fiscalSettings) {
      throw new ResourceNotFoundError(
        'Fiscal settings not found for this company',
      );
    }

    // Validate nfeLastNumber can only increase
    if (
      request.nfeLastNumber !== undefined &&
      request.nfeLastNumber !== null &&
      fiscalSettings.nfeLastNumber &&
      request.nfeLastNumber < fiscalSettings.nfeLastNumber
    ) {
      throw new BadRequestError('NFe last number can only be increased');
    }

    // Validate NFC-e requirements
    if (
      request.nfceEnabled === true &&
      request.digitalCertificateType !== 'A1' &&
      request.digitalCertificateType !== 'A3' &&
      fiscalSettings.digitalCertificateType === 'NONE'
    ) {
      throw new BadRequestError(
        'NFC-e can only be enabled if certificate type is A1 or A3',
      );
    }

    const pendingIssues = this.computePendingIssues(request, fiscalSettings);

    const updatedFiscalSettings = CompanyFiscalSettings.create(
      {
        companyId: fiscalSettings.companyId,
        nfeEnvironment:
          request.nfeEnvironment !== undefined
            ? ((request.nfeEnvironment ?? undefined) as
                | NfeEnvironment
                | undefined)
            : fiscalSettings.nfeEnvironment,
        nfeSeries:
          request.nfeSeries !== undefined
            ? request.nfeSeries ?? undefined
            : fiscalSettings.nfeSeries,
        nfeLastNumber:
          request.nfeLastNumber !== undefined
            ? request.nfeLastNumber ?? undefined
            : fiscalSettings.nfeLastNumber,
        nfeDefaultOperationNature:
          request.nfeDefaultOperationNature !== undefined
            ? request.nfeDefaultOperationNature ?? undefined
            : fiscalSettings.nfeDefaultOperationNature,
        nfeDefaultCfop:
          request.nfeDefaultCfop !== undefined
            ? request.nfeDefaultCfop ?? undefined
            : fiscalSettings.nfeDefaultCfop,
        digitalCertificateType:
          (request.digitalCertificateType ??
            fiscalSettings.digitalCertificateType) as any,
        certificateA1PfxBlob:
          request.certificateA1PfxBlob !== undefined
            ? request.certificateA1PfxBlob ?? undefined
            : fiscalSettings.certificateA1PfxBlob,
        certificateA1Password:
          request.certificateA1Password !== undefined
            ? request.certificateA1Password ?? undefined
            : fiscalSettings.certificateA1Password,
        certificateA1ExpiresAt:
          request.certificateA1ExpiresAt !== undefined
            ? request.certificateA1ExpiresAt ?? undefined
            : fiscalSettings.certificateA1ExpiresAt,
        nfceEnabled: request.nfceEnabled ?? fiscalSettings.nfceEnabled,
        nfceCscId:
          request.nfceCscId !== undefined
            ? request.nfceCscId ?? undefined
            : fiscalSettings.nfceCscId,
        nfceCscToken:
          request.nfceCscToken !== undefined
            ? request.nfceCscToken ?? undefined
            : fiscalSettings.nfceCscToken,
        defaultTaxProfileId:
          request.defaultTaxProfileId !== undefined
            ? request.defaultTaxProfileId
              ? new UniqueEntityID(request.defaultTaxProfileId)
              : undefined
            : fiscalSettings.defaultTaxProfileId,
        metadata: request.metadata ?? fiscalSettings.metadata,
        pendingIssues,
        deletedAt: fiscalSettings.deletedAt,
      },
      fiscalSettings.id,
    );

    await this.companyFiscalSettingsRepository.save(updatedFiscalSettings);

    return { fiscalSettings: updatedFiscalSettings };
  }

  private computePendingIssues(
    request: UpdateCompanyFiscalSettingsRequest,
    current: CompanyFiscalSettings,
  ): string[] {
    const nfeEnv =
      request.nfeEnvironment !== undefined
        ? request.nfeEnvironment
        : current.nfeEnvironment;
    const nfeSeries =
      request.nfeSeries !== undefined ? request.nfeSeries : current.nfeSeries;
    const nfeLastNum =
      request.nfeLastNumber !== undefined
        ? request.nfeLastNumber
        : current.nfeLastNumber;
    const nfeOpNature =
      request.nfeDefaultOperationNature !== undefined
        ? request.nfeDefaultOperationNature
        : current.nfeDefaultOperationNature;
    const nfeCfop =
      request.nfeDefaultCfop !== undefined
        ? request.nfeDefaultCfop
        : current.nfeDefaultCfop;
    const certType =
      request.digitalCertificateType ?? current.digitalCertificateType;
    const certPfx =
      request.certificateA1PfxBlob !== undefined
        ? request.certificateA1PfxBlob
        : current.certificateA1PfxBlob;
    const certPass =
      request.certificateA1Password !== undefined
        ? request.certificateA1Password
        : current.certificateA1Password;
    const nfceEnab = request.nfceEnabled ?? current.nfceEnabled;
    const nfceCscId =
      request.nfceCscId !== undefined ? request.nfceCscId : current.nfceCscId;
    const nfceCscTok =
      request.nfceCscToken !== undefined
        ? request.nfceCscToken
        : current.nfceCscToken;

    const issues: string[] = [];

    if (nfeEnv && !nfeSeries) issues.push('nfeSeries');
    if (nfeEnv && nfeLastNum === undefined) issues.push('nfeLastNumber');
    if (nfeEnv && !nfeOpNature) issues.push('nfeDefaultOperationNature');
    if (nfeEnv && !nfeCfop) issues.push('nfeDefaultCfop');

    if (certType === 'A1' && !certPfx) issues.push('certificateA1PfxBlob');
    if (certType === 'A1' && !certPass) issues.push('certificateA1Password');

    if (nfceEnab && !nfceCscId) issues.push('nfceCscId');
    if (nfceEnab && !nfceCscTok) issues.push('nfceCscToken');

    return issues;
  }
}
