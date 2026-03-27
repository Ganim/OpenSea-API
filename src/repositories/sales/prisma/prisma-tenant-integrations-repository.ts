import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Integration } from '@/entities/sales/integration';
import { TenantIntegration } from '@/entities/sales/tenant-integration';
import { prisma } from '@/lib/prisma';
import type {
  CreateTenantIntegrationSchema,
  TenantIntegrationsRepository,
  UpdateTenantIntegrationSchema,
} from '../tenant-integrations-repository';

function mapIntegrationToDomain(raw: Record<string, unknown>): Integration {
  return Integration.create(
    {
      name: raw.name as string,
      slug: raw.slug as string,
      description: (raw.description as string) ?? undefined,
      logoUrl: (raw.logoUrl as string) ?? undefined,
      category: raw.category as string,
      configSchema: (raw.configSchema as Record<string, unknown>) ?? {},
      isAvailable: raw.isAvailable as boolean,
      createdAt: raw.createdAt as Date,
      updatedAt: (raw.updatedAt as Date) ?? undefined,
    },
    new EntityID(raw.id as string),
  );
}

function mapToDomain(raw: Record<string, unknown>): TenantIntegration {
  const integrationData = raw.integration as
    | Record<string, unknown>
    | undefined;

  return TenantIntegration.create(
    {
      tenantId: new EntityID(raw.tenantId as string),
      integrationId: new EntityID(raw.integrationId as string),
      config: (raw.config as Record<string, unknown>) ?? {},
      status: raw.status as string,
      lastSyncAt: (raw.lastSyncAt as Date) ?? undefined,
      errorMessage: (raw.errorMessage as string) ?? undefined,
      createdAt: raw.createdAt as Date,
      updatedAt: (raw.updatedAt as Date) ?? undefined,
      integration: integrationData
        ? mapIntegrationToDomain(integrationData)
        : undefined,
    },
    new EntityID(raw.id as string),
  );
}

export class PrismaTenantIntegrationsRepository
  implements TenantIntegrationsRepository
{
  async create(
    data: CreateTenantIntegrationSchema,
  ): Promise<TenantIntegration> {
    const tenantIntegration = await prisma.tenantIntegration.create({
      data: {
        tenantId: data.tenantId,
        integrationId: data.integrationId,
        config: data.config,
        status: data.status,
      },
      include: { integration: true },
    });

    return mapToDomain(tenantIntegration as unknown as Record<string, unknown>);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<TenantIntegration | null> {
    const tenantIntegration = await prisma.tenantIntegration.findFirst({
      where: { id: id.toString(), tenantId },
      include: { integration: true },
    });

    if (!tenantIntegration) return null;
    return mapToDomain(tenantIntegration as unknown as Record<string, unknown>);
  }

  async findByTenantAndIntegration(
    tenantId: string,
    integrationId: string,
  ): Promise<TenantIntegration | null> {
    const tenantIntegration = await prisma.tenantIntegration.findUnique({
      where: {
        tenantId_integrationId: { tenantId, integrationId },
      },
      include: { integration: true },
    });

    if (!tenantIntegration) return null;
    return mapToDomain(tenantIntegration as unknown as Record<string, unknown>);
  }

  async findManyByTenant(tenantId: string): Promise<TenantIntegration[]> {
    const tenantIntegrations = await prisma.tenantIntegration.findMany({
      where: { tenantId },
      include: { integration: true },
      orderBy: { createdAt: 'desc' },
    });

    return tenantIntegrations.map((ti) =>
      mapToDomain(ti as unknown as Record<string, unknown>),
    );
  }

  async update(
    data: UpdateTenantIntegrationSchema,
  ): Promise<TenantIntegration | null> {
    const existing = await prisma.tenantIntegration.findFirst({
      where: { id: data.id.toString(), tenantId: data.tenantId },
    });

    if (!existing) return null;

    const updateData: Record<string, unknown> = {};
    if (data.config !== undefined) updateData.config = data.config;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.lastSyncAt !== undefined) updateData.lastSyncAt = data.lastSyncAt;
    if (data.errorMessage !== undefined)
      updateData.errorMessage = data.errorMessage;

    const updated = await prisma.tenantIntegration.update({
      where: { id: data.id.toString() },
      data: updateData,
      include: { integration: true },
    });

    return mapToDomain(updated as unknown as Record<string, unknown>);
  }

  async save(tenantIntegration: TenantIntegration): Promise<void> {
    await prisma.tenantIntegration.update({
      where: { id: tenantIntegration.id.toString() },
      data: {
        config: tenantIntegration.config,
        status: tenantIntegration.status,
        lastSyncAt: tenantIntegration.lastSyncAt ?? null,
        errorMessage: tenantIntegration.errorMessage ?? null,
      },
    });
  }
}
