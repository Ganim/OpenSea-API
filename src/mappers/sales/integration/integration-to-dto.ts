import type { Integration } from '@/entities/sales/integration';

export interface IntegrationDTO {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  category: string;
  configSchema: Record<string, unknown>;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export function integrationToDTO(integration: Integration): IntegrationDTO {
  const dto: IntegrationDTO = {
    id: integration.id.toString(),
    name: integration.name,
    slug: integration.slug,
    category: integration.category,
    configSchema: integration.configSchema,
    isAvailable: integration.isAvailable,
    createdAt: integration.createdAt,
  };

  if (integration.description) dto.description = integration.description;
  if (integration.logoUrl) dto.logoUrl = integration.logoUrl;
  if (integration.updatedAt) dto.updatedAt = integration.updatedAt;

  return dto;
}
