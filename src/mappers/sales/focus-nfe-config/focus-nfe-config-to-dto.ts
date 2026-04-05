import type { FocusNfeConfig } from '@/entities/sales/focus-nfe-config';

export interface FocusNfeConfigDTO {
  id: string;
  tenantId: string;
  productionMode: boolean;
  isEnabled: boolean;
  defaultSeries: string;
  autoIssueOnConfirm: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Mapeia FocusNfeConfig para DTO, redactando a apiKey
 */
export function focusNfeConfigToDTO(config: FocusNfeConfig): FocusNfeConfigDTO {
  return {
    id: config.id.toString(),
    tenantId: config.tenantId.toString(),
    productionMode: config.productionMode,
    isEnabled: config.isEnabled,
    defaultSeries: config.defaultSeries,
    autoIssueOnConfirm: config.autoIssueOnConfirm,
    createdBy: config.createdBy,
    updatedBy: config.updatedBy,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  };
}
