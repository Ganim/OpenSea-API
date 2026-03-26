import {
  FiscalConfig,
  type FiscalEnvironment,
  type FiscalProvider,
  type TaxRegime,
} from '@/entities/fiscal/fiscal-config';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { prisma, Prisma } from '@/lib/prisma';
import {
  FiscalProviderType as PrismaFiscalProviderType,
  NfeEnvironment as PrismaNfeEnvironment,
  TaxRegimeEnum as PrismaTaxRegimeEnum,
  FiscalEmissionType as PrismaFiscalEmissionType,
} from '@prisma/generated/client.js';
import type { FiscalConfigsRepository } from '../fiscal-configs-repository';

function toDomain(raw: Record<string, unknown>): FiscalConfig {
  return FiscalConfig.create(
    {
      id: new UniqueEntityID(raw.id as string),
      tenantId: new UniqueEntityID(raw.tenantId as string),
      provider: raw.provider as FiscalProvider,
      environment: raw.environment as FiscalEnvironment,
      apiKey: (raw.apiKey as string) ?? '',
      apiSecret: (raw.apiSecret as string) ?? undefined,
      defaultSeries: raw.defaultSeries as number,
      lastNfeNumber: raw.lastNfeNumber as number,
      lastNfceNumber: raw.lastNfceNumber as number,
      defaultCfop: (raw.defaultCfop as string) ?? '',
      defaultNaturezaOperacao: (raw.defaultNaturezaOperacao as string) ?? '',
      taxRegime: raw.taxRegime as TaxRegime,
      nfceEnabled: raw.nfceEnabled as boolean,
      nfceCscId: (raw.nfceCscId as string) ?? undefined,
      nfceCscToken: (raw.nfceCscToken as string) ?? undefined,
      certificateId: raw.certificateId
        ? new UniqueEntityID(raw.certificateId as string)
        : undefined,
      contingencyMode: raw.contingencyMode !== 'NORMAL',
      contingencyReason: (raw.contingencyReason as string) ?? undefined,
      settings: (raw.settings as Record<string, unknown>) ?? {},
      createdAt: raw.createdAt as Date,
      updatedAt: (raw.updatedAt as Date) ?? undefined,
    },
    new UniqueEntityID(raw.id as string),
  );
}

export class PrismaFiscalConfigsRepository implements FiscalConfigsRepository {
  async findByTenantId(tenantId: string): Promise<FiscalConfig | null> {
    const configRecord = await prisma.fiscalConfig.findUnique({
      where: { tenantId },
    });

    return configRecord
      ? toDomain(configRecord as unknown as Record<string, unknown>)
      : null;
  }

  async create(config: FiscalConfig): Promise<void> {
    await prisma.fiscalConfig.create({
      data: {
        id: config.id.toString(),
        tenantId: config.tenantId.toString(),
        provider: config.provider as unknown as PrismaFiscalProviderType,
        environment: config.environment as unknown as PrismaNfeEnvironment,
        apiKey: config.apiKey || null,
        apiSecret: config.apiSecret ?? null,
        defaultSeries: config.defaultSeries,
        lastNfeNumber: config.lastNfeNumber,
        lastNfceNumber: config.lastNfceNumber,
        defaultCfop: config.defaultCfop || null,
        defaultNaturezaOperacao: config.defaultNaturezaOperacao || null,
        taxRegime: config.taxRegime as unknown as PrismaTaxRegimeEnum,
        nfceEnabled: config.nfceEnabled,
        nfceCscId: config.nfceCscId ?? null,
        nfceCscToken: config.nfceCscToken ?? null,
        certificateId: config.certificateId?.toString() ?? null,
        contingencyMode: config.contingencyMode
          ? PrismaFiscalEmissionType.CONTINGENCY_OFFLINE
          : PrismaFiscalEmissionType.NORMAL,
        contingencyReason: config.contingencyReason ?? null,
        settings: (config.settings as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        createdAt: config.createdAt,
      },
    });
  }

  async save(config: FiscalConfig): Promise<void> {
    await prisma.fiscalConfig.update({
      where: { id: config.id.toString() },
      data: {
        provider: config.provider as unknown as PrismaFiscalProviderType,
        environment: config.environment as unknown as PrismaNfeEnvironment,
        apiKey: config.apiKey || null,
        apiSecret: config.apiSecret ?? null,
        defaultSeries: config.defaultSeries,
        lastNfeNumber: config.lastNfeNumber,
        lastNfceNumber: config.lastNfceNumber,
        defaultCfop: config.defaultCfop || null,
        defaultNaturezaOperacao: config.defaultNaturezaOperacao || null,
        taxRegime: config.taxRegime as unknown as PrismaTaxRegimeEnum,
        nfceEnabled: config.nfceEnabled,
        nfceCscId: config.nfceCscId ?? null,
        nfceCscToken: config.nfceCscToken ?? null,
        certificateId: config.certificateId?.toString() ?? null,
        contingencyMode: config.contingencyMode
          ? PrismaFiscalEmissionType.CONTINGENCY_OFFLINE
          : PrismaFiscalEmissionType.NORMAL,
        contingencyReason: config.contingencyReason ?? null,
        settings: (config.settings as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      },
    });
  }
}
