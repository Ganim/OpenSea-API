import type {
  CareLabelInfo,
  Template,
  TemplateAttributesMap,
} from '@/entities/stock/template';

export interface TemplateDTO {
  id: string;
  name: string;
  iconUrl: string | null;
  unitOfMeasure: string;
  productAttributes: TemplateAttributesMap;
  variantAttributes: TemplateAttributesMap;
  itemAttributes: TemplateAttributesMap;
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
    iconUrl: template.iconUrl ?? null,
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
