import type {
  CareLabelInfo,
  Template,
  TemplateAttributesMap,
} from '@/entities/stock/template';

export interface TemplateDTO {
  id: string;
  code: string | null; // Código hierárquico (3 dígitos: 001)
  sequentialCode: number | null;
  name: string;
  iconUrl: string | null;
  unitOfMeasure: string;
  productAttributes: TemplateAttributesMap;
  variantAttributes: TemplateAttributesMap;
  itemAttributes: TemplateAttributesMap;
  careLabel: CareLabelInfo | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;
}

export function templateToDTO(template: Template): TemplateDTO {
  return {
    id: template.id.toString(),
    code: template.code ?? null,
    sequentialCode: template.sequentialCode ?? null,
    name: template.name,
    iconUrl: template.iconUrl ?? null,
    unitOfMeasure: template.unitOfMeasure?.value ?? 'UNITS',
    productAttributes: template.productAttributes,
    variantAttributes: template.variantAttributes,
    itemAttributes: template.itemAttributes,
    careLabel: template.careLabel ?? null,
    isActive: template.isActive,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt ?? null,
    deletedAt: template.deletedAt ?? null,
  };
}
