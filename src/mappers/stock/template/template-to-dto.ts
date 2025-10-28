import type { Template } from '@/entities/stock/template';

export interface TemplateDTO {
  id: string;
  name: string;
  productAttributes: Record<string, unknown>;
  variantAttributes: Record<string, unknown>;
  itemAttributes: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;
}

export function templateToDTO(template: Template): TemplateDTO {
  return {
    id: template.id.toString(),
    name: template.name,
    productAttributes: template.productAttributes,
    variantAttributes: template.variantAttributes,
    itemAttributes: template.itemAttributes,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt ?? null,
    deletedAt: template.deletedAt ?? null,
  };
}
