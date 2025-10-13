import type { Product } from '@/entities/stock/product';

export interface ProductDTO {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: string;
  unitOfMeasure: string;
  attributes: Record<string, unknown>;
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
    description: product.description,
    status: product.status.value,
    unitOfMeasure: product.unitOfMeasure.value,
    attributes: product.attributes,
    templateId: product.templateId.toString(),
    supplierId: product.supplierId?.toString(),
    manufacturerId: product.manufacturerId?.toString(),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    deletedAt: product.deletedAt,
  };
}
