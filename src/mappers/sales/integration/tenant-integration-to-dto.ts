import type { TenantIntegration } from '@/entities/sales/tenant-integration';
import type { IntegrationDTO } from './integration-to-dto';
import { integrationToDTO } from './integration-to-dto';

export interface TenantIntegrationDTO {
  id: string;
  tenantId: string;
  integrationId: string;
  config: Record<string, unknown>;
  status: string;
  lastSyncAt?: Date;
  errorMessage?: string;
  createdAt: Date;
  updatedAt?: Date;
  integration?: IntegrationDTO;
}

export function tenantIntegrationToDTO(
  tenantIntegration: TenantIntegration,
): TenantIntegrationDTO {
  const dto: TenantIntegrationDTO = {
    id: tenantIntegration.id.toString(),
    tenantId: tenantIntegration.tenantId.toString(),
    integrationId: tenantIntegration.integrationId.toString(),
    config: tenantIntegration.config,
    status: tenantIntegration.status,
    createdAt: tenantIntegration.createdAt,
  };

  if (tenantIntegration.lastSyncAt)
    dto.lastSyncAt = tenantIntegration.lastSyncAt;
  if (tenantIntegration.errorMessage)
    dto.errorMessage = tenantIntegration.errorMessage;
  if (tenantIntegration.updatedAt) dto.updatedAt = tenantIntegration.updatedAt;
  if (tenantIntegration.integration)
    dto.integration = integrationToDTO(tenantIntegration.integration);

  return dto;
}
