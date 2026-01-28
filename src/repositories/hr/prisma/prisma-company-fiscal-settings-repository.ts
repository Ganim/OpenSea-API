import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  CompanyFiscalSettings,
  type NfeEnvironment,
  type DigitalCertificateType,
} from '@/entities/hr/company-fiscal-settings';
import { prisma } from '@/lib/prisma';
import { mapCompanyFiscalSettingsPrismaToDomain } from '@/mappers/hr/company-fiscal-settings';
import type { Prisma } from '@prisma/generated/client.js';
import type {
  CompanyFiscalSettingsRepository,
  CreateCompanyFiscalSettingsSchema,
} from '../company-fiscal-settings-repository';

export class PrismaCompanyFiscalSettingsRepository
  implements CompanyFiscalSettingsRepository
{
  async create(
    data: CreateCompanyFiscalSettingsSchema,
  ): Promise<CompanyFiscalSettings> {
    const created = await prisma.companyFiscalSettings.create({
      data: {
        companyId: data.companyId.toString(),
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
        defaultTaxProfileId: data.defaultTaxProfileId?.toString(),
        pendingIssues: data.pendingIssues ?? [],
        metadata: (data.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });

    return CompanyFiscalSettings.create(
      mapCompanyFiscalSettingsPrismaToDomain(created),
      new UniqueEntityID(created.id),
    );
  }

  async findById(
    id: UniqueEntityID,
    options?: { companyId?: UniqueEntityID; includeDeleted?: boolean },
  ): Promise<CompanyFiscalSettings | null> {
    const fiscalSettings = await prisma.companyFiscalSettings.findFirst({
      where: {
        id: id.toString(),
        ...(options?.companyId
          ? { companyId: options.companyId.toString() }
          : {}),
        ...(options?.includeDeleted ? {} : { deletedAt: null }),
      },
    });

    if (!fiscalSettings) return null;

    return CompanyFiscalSettings.create(
      mapCompanyFiscalSettingsPrismaToDomain(fiscalSettings),
      new UniqueEntityID(fiscalSettings.id),
    );
  }

  async findByCompanyId(
    companyId: UniqueEntityID,
    options?: { includeDeleted?: boolean },
  ): Promise<CompanyFiscalSettings | null> {
    const fiscalSettings = await prisma.companyFiscalSettings.findFirst({
      where: {
        companyId: companyId.toString(),
        ...(options?.includeDeleted ? {} : { deletedAt: null }),
      },
    });

    if (!fiscalSettings) return null;

    return CompanyFiscalSettings.create(
      mapCompanyFiscalSettingsPrismaToDomain(fiscalSettings),
      new UniqueEntityID(fiscalSettings.id),
    );
  }

  async save(fiscalSettings: CompanyFiscalSettings): Promise<void> {
    await prisma.companyFiscalSettings.update({
      where: {
        id: fiscalSettings.id.toString(),
      },
      data: {
        nfeEnvironment: fiscalSettings.nfeEnvironment,
        nfeSeries: fiscalSettings.nfeSeries,
        nfeLastNumber: fiscalSettings.nfeLastNumber,
        nfeDefaultOperationNature: fiscalSettings.nfeDefaultOperationNature,
        nfeDefaultCfop: fiscalSettings.nfeDefaultCfop,
        digitalCertificateType: fiscalSettings.digitalCertificateType,
        certificateA1PfxBlob: fiscalSettings.certificateA1PfxBlob,
        certificateA1Password: fiscalSettings.certificateA1Password,
        certificateA1ExpiresAt: fiscalSettings.certificateA1ExpiresAt,
        nfceEnabled: fiscalSettings.nfceEnabled,
        nfceCscId: fiscalSettings.nfceCscId,
        nfceCscToken: fiscalSettings.nfceCscToken,
        defaultTaxProfileId: fiscalSettings.defaultTaxProfileId?.toString(),
        metadata: fiscalSettings.metadata as Prisma.InputJsonValue,
        pendingIssues: fiscalSettings.pendingIssues,
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.companyFiscalSettings.delete({
      where: { id: id.toString() },
    });
  }

  async softDelete(id: UniqueEntityID): Promise<void> {
    await prisma.companyFiscalSettings.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date() },
    });
  }
}
