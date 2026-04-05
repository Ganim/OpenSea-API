import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FocusNfeConfig } from '@/entities/sales/focus-nfe-config';
import { prisma } from '@/lib/prisma';
import type { FocusNfeConfigRepository } from '@/repositories/sales/focus-nfe-config-repository';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapToDomain(data: any): FocusNfeConfig {
  return FocusNfeConfig.create(
    {
      tenantId: new UniqueEntityID(data.tenantId),
      apiKey: data.apiKey,
      productionMode: data.productionMode,
      isEnabled: data.isEnabled,
      defaultSeries: data.defaultSeries,
      autoIssueOnConfirm: data.autoIssueOnConfirm,
      createdBy: data.createdBy ?? undefined,
      updatedBy: data.updatedBy ?? undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt ?? undefined,
    },
    new UniqueEntityID(data.id),
  );
}

export class PrismaFocusNfeConfigRepository implements FocusNfeConfigRepository {
  async create(config: FocusNfeConfig): Promise<void> {
    await prisma.focusNfeConfig.create({
      data: {
        id: config.id.toString(),
        tenantId: config.tenantId.toString(),
        apiKey: config.apiKey,
        productionMode: config.productionMode,
        isEnabled: config.isEnabled,
        defaultSeries: config.defaultSeries,
        autoIssueOnConfirm: config.autoIssueOnConfirm,
        createdBy: config.createdBy,
        updatedBy: config.updatedBy,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      },
    });
  }

  async findByTenant(tenantId: string): Promise<FocusNfeConfig | null> {
    const data = await prisma.focusNfeConfig.findUnique({
      where: { tenantId },
    });

    if (!data) {
      return null;
    }

    return mapToDomain(data);
  }

  async save(config: FocusNfeConfig): Promise<void> {
    await prisma.focusNfeConfig.update({
      where: { tenantId: config.tenantId.toString() },
      data: {
        apiKey: config.apiKey,
        productionMode: config.productionMode,
        isEnabled: config.isEnabled,
        defaultSeries: config.defaultSeries,
        autoIssueOnConfirm: config.autoIssueOnConfirm,
        updatedBy: config.updatedBy,
        updatedAt: new Date(),
      },
    });
  }

  async delete(tenantId: string): Promise<void> {
    await prisma.focusNfeConfig.delete({
      where: { tenantId },
    });
  }
}
