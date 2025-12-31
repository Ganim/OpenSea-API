import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  CompanyFiscalSettings,
  type NfeEnvironment,
  type DigitalCertificateType,
} from '@/entities/hr/company-fiscal-settings';
import type {
  CompanyFiscalSettingsRepository,
  CreateCompanyFiscalSettingsSchema,
} from '../company-fiscal-settings-repository';

export class InMemoryCompanyFiscalSettingsRepository
  implements CompanyFiscalSettingsRepository
{
  public items: CompanyFiscalSettings[] = [];

  async create(
    data: CreateCompanyFiscalSettingsSchema,
  ): Promise<CompanyFiscalSettings> {
    const fiscalSettings = CompanyFiscalSettings.create(
      {
        companyId: data.companyId,
        nfeEnvironment: data.nfeEnvironment as NfeEnvironment | undefined,
        nfeSeries: data.nfeSeries,
        nfeLastNumber: data.nfeLastNumber,
        nfeDefaultOperationNature: data.nfeDefaultOperationNature,
        nfeDefaultCfop: data.nfeDefaultCfop,
        digitalCertificateType:
          (data.digitalCertificateType as DigitalCertificateType | undefined) ??
          'NONE',
        certificateA1PfxBlob: data.certificateA1PfxBlob,
        certificateA1Password: data.certificateA1Password,
        certificateA1ExpiresAt: data.certificateA1ExpiresAt,
        nfceEnabled: data.nfceEnabled ?? false,
        nfceCscId: data.nfceCscId,
        nfceCscToken: data.nfceCscToken,
        defaultTaxProfileId: data.defaultTaxProfileId,
        metadata: data.metadata ?? {},
        pendingIssues: data.pendingIssues ?? [],
      },
      new UniqueEntityID(),
    );

    this.items.push(fiscalSettings);
    return fiscalSettings;
  }

  async findById(
    id: UniqueEntityID,
    options?: { companyId?: UniqueEntityID; includeDeleted?: boolean },
  ): Promise<CompanyFiscalSettings | null> {
    const fiscalSettings = this.items.find((item) => {
      const idMatch = item.id.equals(id);
      const companyMatch = options?.companyId
        ? item.companyId.equals(options.companyId)
        : true;
      const deletedMatch = options?.includeDeleted ? true : !item.deletedAt;
      return idMatch && companyMatch && deletedMatch;
    });
    return fiscalSettings ?? null;
  }

  async findByCompanyId(
    companyId: UniqueEntityID,
    options?: { includeDeleted?: boolean },
  ): Promise<CompanyFiscalSettings | null> {
    const fiscalSettings = this.items.find((item) => {
      const companyMatch = item.companyId.equals(companyId);
      const deletedMatch = options?.includeDeleted ? true : !item.deletedAt;
      return companyMatch && deletedMatch;
    });
    return fiscalSettings ?? null;
  }

  async save(fiscalSettings: CompanyFiscalSettings): Promise<void> {
    const index = this.items.findIndex((item) =>
      item.id.equals(fiscalSettings.id),
    );

    if (index !== -1) {
      this.items[index] = fiscalSettings;
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    this.items = this.items.filter((item) => !item.id.equals(id));
  }

  async softDelete(id: UniqueEntityID): Promise<void> {
    const item = this.items.find((item) => item.id.equals(id));
    if (item) {
      const updatedItem = CompanyFiscalSettings.create(
        {
          ...item.props,
          deletedAt: new Date(),
        },
        item.id,
      );
      await this.save(updatedItem);
    }
  }
}
