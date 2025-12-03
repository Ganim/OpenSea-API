import type { CareLabelInfo, Template } from '@/entities/stock/template';

export interface TemplateDTO {
  id: string;
  name: string;
  unitOfMeasure: string;
  productAttributes: Record<string, unknown>;
  variantAttributes: Record<string, unknown>;
  itemAttributes: Record<string, unknown>;
  careLabel: CareLabelInfo | null;
  sequentialCode: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;
}

export function templateToDTO(template: Template): TemplateDTO {
  return {
    id: template.id.toString(),
    name: template.name,
    unitOfMeasure: template.unitOfMeasure?.value ?? 'UNITS',
    productAttributes: template.productAttributes,
    variantAttributes: template.variantAttributes,
    itemAttributes: template.itemAttributes,
    careLabel: template.careLabel ?? null,
    sequentialCode: template.sequentialCode ?? null,
    isActive: template.isActive,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt ?? null,
    deletedAt: template.deletedAt ?? null,
  };
}
