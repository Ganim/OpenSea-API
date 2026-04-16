import type { ContractTemplate } from '@/entities/hr/contract-template';

export interface ContractTemplateDTO {
  id: string;
  name: string;
  type: string;
  content: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export function contractTemplateToDTO(
  template: ContractTemplate,
): ContractTemplateDTO {
  return {
    id: template.id.toString(),
    name: template.name,
    type: template.type,
    content: template.content,
    isActive: template.isActive,
    isDefault: template.isDefault,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
    deletedAt: template.deletedAt ?? null,
  };
}

/**
 * Lightweight DTO for list views: omits the (potentially large) template
 * content payload.
 */
export interface ContractTemplateSummaryDTO {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function contractTemplateToSummaryDTO(
  template: ContractTemplate,
): ContractTemplateSummaryDTO {
  return {
    id: template.id.toString(),
    name: template.name,
    type: template.type,
    isActive: template.isActive,
    isDefault: template.isDefault,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  };
}
