import type { Product } from '@/entities/stock/product';

export interface ProductDTO {
  id: string;
  name: string;
  code?: string;
  fullCode?: string;
  sequentialCode?: number;
  description?: string;
  status: string;
  attributes: Record<string, unknown>;
  careInstructionIds: string[];
  templateId: string;
  supplierId?: string;
  manufacturerId?: string;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export function productToDTO(product: Product): ProductDTO {
  return {
    id: product.id.toString(),
    name: product.name,
    code: product.code,
    fullCode: product.fullCode,
    sequentialCode: product.sequentialCode,
    description: product.description,
    status: product.status.value,
    attributes: product.attributes,
    careInstructionIds: product.careInstructionIds,
    templateId: product.templateId.toString(),
    supplierId: product.supplierId?.toString(),
    manufacturerId: product.manufacturerId?.toString(),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    deletedAt: product.deletedAt,
  };
}
