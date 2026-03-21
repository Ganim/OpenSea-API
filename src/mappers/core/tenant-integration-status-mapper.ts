import { TenantIntegrationStatus } from '@/entities/core/tenant-integration-status';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TenantIntegrationStatus as PrismaTenantIntegrationStatus } from '@prisma/generated/client';

export interface TenantIntegrationStatusDTO {
  id: string;
  tenantId: string;
  integrationType: string;
  status: string;
  lastCheckAt: Date | null;
  errorMessage: string | null;
  externalId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export function tenantIntegrationStatusPrismaToDomain(
  raw: PrismaTenantIntegrationStatus,
): TenantIntegrationStatus {
  const metadata = raw.metadata as Record<string, unknown> | null;

  return TenantIntegrationStatus.create(
    {
      id: new UniqueEntityID(raw.id),
      tenantId: raw.tenantId,
      integrationType: raw.integrationType,
      status: raw.connectionStatus,
      lastCheckAt: raw.lastSyncAt,
      errorMessage: raw.errorMessage,
      externalId:
        metadata && typeof metadata.externalId === 'string'
          ? metadata.externalId
          : null,
      metadata,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
    new UniqueEntityID(raw.id),
  );
}

export function tenantIntegrationStatusToDTO(
  integration: TenantIntegrationStatus,
): TenantIntegrationStatusDTO {
  return {
    id: integration.tenantIntegrationStatusId.toString(),
    tenantId: integration.tenantId,
    integrationType: integration.integrationType,
    status: integration.status,
    lastCheckAt: integration.lastCheckAt,
    errorMessage: integration.errorMessage,
    externalId: integration.externalId,
    metadata: integration.metadata,
    createdAt: integration.createdAt,
    updatedAt: integration.updatedAt ?? integration.createdAt,
  };
}

export function tenantIntegrationStatusToPrisma(
  integration: TenantIntegrationStatus,
) {
  const metadata: Record<string, unknown> = {
    ...(integration.metadata ?? {}),
  };
  if (integration.externalId) {
    metadata.externalId = integration.externalId;
  }

  return {
    id: integration.tenantIntegrationStatusId.toString(),
    tenantId: integration.tenantId,
    integrationType:
      integration.integrationType as PrismaTenantIntegrationStatus['integrationType'],
    connectionStatus:
      integration.status as PrismaTenantIntegrationStatus['connectionStatus'],
    lastSyncAt: integration.lastCheckAt,
    errorMessage: integration.errorMessage,
    metadata,
  };
}
