import {
  tenantIntegrationStatusPrismaToDomain,
  tenantIntegrationStatusToPrisma,
} from '@/mappers/core/tenant-integration-status-mapper';
import { prisma } from '@/lib/prisma';
import type { TenantIntegrationStatus } from '@/entities/core/tenant-integration-status';
import type { Prisma } from '@prisma/generated/client';
import type { TenantIntegrationStatusRepository } from '../tenant-integration-status-repository';

export class PrismaTenantIntegrationStatusRepository
  implements TenantIntegrationStatusRepository
{
  async findAll(): Promise<TenantIntegrationStatus[]> {
    const integrationsDb = await prisma.tenantIntegrationStatus.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return integrationsDb.map(tenantIntegrationStatusPrismaToDomain);
  }

  async findByTenantId(tenantId: string): Promise<TenantIntegrationStatus[]> {
    const integrationsDb = await prisma.tenantIntegrationStatus.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return integrationsDb.map(tenantIntegrationStatusPrismaToDomain);
  }

  async findByTenantAndType(
    tenantId: string,
    type: string,
  ): Promise<TenantIntegrationStatus | null> {
    const integrationDb = await prisma.tenantIntegrationStatus.findUnique({
      where: {
        tenantId_integrationType: {
          tenantId,
          integrationType: type as never,
        },
      },
    });
    if (!integrationDb) return null;

    return tenantIntegrationStatusPrismaToDomain(integrationDb);
  }

  async findAllByType(type: string): Promise<TenantIntegrationStatus[]> {
    const integrationsDb = await prisma.tenantIntegrationStatus.findMany({
      where: { integrationType: type as never },
      orderBy: { createdAt: 'desc' },
    });

    return integrationsDb.map(tenantIntegrationStatusPrismaToDomain);
  }

  async upsert(entity: TenantIntegrationStatus): Promise<void> {
    const prismaData = tenantIntegrationStatusToPrisma(entity);

    await prisma.tenantIntegrationStatus.upsert({
      where: {
        tenantId_integrationType: {
          tenantId: prismaData.tenantId,
          integrationType: prismaData.integrationType,
        },
      },
      create: prismaData as Prisma.TenantIntegrationStatusUncheckedCreateInput,
      update: prismaData as Prisma.TenantIntegrationStatusUncheckedUpdateInput,
    });
  }
}
