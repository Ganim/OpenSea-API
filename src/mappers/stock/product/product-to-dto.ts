import type { Category } from '@/entities/stock/category';
import type { Manufacturer } from '@/entities/stock/manufacturer';
import type { Product } from '@/entities/stock/product';
import type { Supplier } from '@/entities/stock/supplier';
import type { Tag } from '@/entities/stock/tag';
import type { Template } from '@/entities/stock/template';
import type { Variant } from '@/entities/stock/variant';

// DTOs das entidades relacionadas
export interface TemplateDTO {
  id: string;
  name: string;
  unitOfMeasure: string;
  sequentialCode?: number;
  productAttributes: Record<string, unknown>;
  variantAttributes: Record<string, unknown>;
  itemAttributes: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface SupplierDTO {
  id: string;
  name: string;
  sequentialCode?: number;
  cnpj?: string;
  taxId?: string;
  contact?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  paymentTerms?: string;
  rating?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ManufacturerDTO {
  id: string;
  name: string;
  country: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  city?: string | null;
  state?: string | null;
  rating?: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface TagDTO {
  id: string;
  name: string;
  slug: string;
  color?: string | null;
  description?: string | null;
}

export interface VariantDTO {
  id: string;
  sku?: string;
  fullCode?: string;
  sequentialCode?: number;
  name: string;
  price: number;
  costPrice?: number;
  profitMargin?: number;
  imageUrl?: string;
  barcode?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

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
  template?: TemplateDTO;
  supplierId?: string;
  supplier?: SupplierDTO | null;
  manufacturerId?: string;
  manufacturer?: ManufacturerDTO | null;
  organizationId?: string;
  variants?: VariantDTO[];
  productCategories?: CategoryDTO[];
  productTags?: TagDTO[];
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

// Função auxiliar para converter Template
function templateToDTO(template: Template | undefined): TemplateDTO | undefined {
  if (!template) return undefined;
  return {
    id: template.id.toString(),
    name: template.name,
    unitOfMeasure: template.unitOfMeasure.value,
    sequentialCode: template.sequentialCode,
    productAttributes: template.productAttributes,
    variantAttributes: template.variantAttributes,
    itemAttributes: template.itemAttributes,
    isActive: template.isActive,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  };
}

// Função auxiliar para converter Supplier
function supplierToDTO(supplier: Supplier | null | undefined): SupplierDTO | null | undefined {
  if (!supplier) return supplier;
  return {
    id: supplier.id.toString(),
    name: supplier.name,
    sequentialCode: supplier.sequentialCode,
    cnpj: supplier.cnpj?.toString(),
    taxId: supplier.taxId,
    contact: supplier.contact,
    email: supplier.email,
    phone: supplier.phone,
    website: supplier.website,
    address: supplier.address,
    city: supplier.city,
    state: supplier.state,
    zipCode: supplier.zipCode,
    country: supplier.country,
    paymentTerms: supplier.paymentTerms,
    rating: supplier.rating ? Number(supplier.rating) : undefined,
    isActive: supplier.isActive,
    createdAt: supplier.createdAt,
    updatedAt: supplier.updatedAt,
  };
}

// Função auxiliar para converter Manufacturer
function manufacturerToDTO(manufacturer: Manufacturer | null | undefined): ManufacturerDTO | null | undefined {
  if (!manufacturer) return manufacturer;
  return {
    id: manufacturer.id.toString(),
    name: manufacturer.name,
    country: manufacturer.country,
    email: manufacturer.email,
    phone: manufacturer.phone,
    website: manufacturer.website,
    city: manufacturer.city,
    state: manufacturer.state,
    rating: manufacturer.rating,
    isActive: manufacturer.isActive,
    createdAt: manufacturer.createdAt,
    updatedAt: manufacturer.updatedAt,
  };
}

// Função auxiliar para converter Category
function categoryToDTO(category: Category): CategoryDTO {
  return {
    id: category.id.toString(),
    name: category.name,
    slug: category.slug,
    description: category.description,
    displayOrder: category.displayOrder,
    isActive: category.isActive,
  };
}

// Função auxiliar para converter Tag
function tagToDTO(tag: Tag): TagDTO {
  return {
    id: tag.id.toString(),
    name: tag.name,
    slug: tag.slug,
    color: tag.color,
    description: tag.description,
  };
}

// Função auxiliar para converter Variant
function variantToDTO(variant: Variant): VariantDTO {
  return {
    id: variant.id.toString(),
    sku: variant.sku,
    fullCode: variant.fullCode,
    sequentialCode: variant.sequentialCode,
    name: variant.name,
    price: variant.price,
    costPrice: variant.costPrice,
    profitMargin: variant.profitMargin,
    imageUrl: variant.imageUrl,
    barcode: variant.barcode,
    isActive: variant.isActive,
    createdAt: variant.createdAt,
    updatedAt: variant.updatedAt,
  };
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
    template: templateToDTO(product.template),
    supplierId: product.supplierId?.toString(),
    supplier: supplierToDTO(product.supplier),
    manufacturerId: product.manufacturerId?.toString(),
    manufacturer: manufacturerToDTO(product.manufacturer),
    organizationId: product.organizationId?.toString(),
    variants: product.variants?.map(variantToDTO),
    productCategories: product.categories?.map(categoryToDTO),
    productTags: product.tags?.map(tagToDTO),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    deletedAt: product.deletedAt,
  };
}
