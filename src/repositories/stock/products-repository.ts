import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Product } from '@/entities/stock/product';
import { ProductStatus } from '@/entities/stock/value-objects/product-status';
import { Slug } from '@/entities/stock/value-objects/slug';

export interface CreateProductSchema {
  name: string;
  slug: Slug; // Slug gerado automaticamente - IMUTÁVEL
  fullCode: string; // Código hierárquico: TEMPLATE.FABRICANTE.PRODUTO (ex: 001.001.0001)
  barcode: string; // Code128 gerado do fullCode - IMUTÁVEL
  eanCode: string; // EAN-13 gerado do fullCode - IMUTÁVEL
  upcCode: string; // UPC gerado do fullCode - IMUTÁVEL
  description?: string;
  status?: ProductStatus;
  outOfLine?: boolean;
  templateId: UniqueEntityID; // Obrigatório
  supplierId?: UniqueEntityID;
  manufacturerId?: UniqueEntityID;
  attributes?: Record<string, unknown>;
}

export interface UpdateProductSchema {
  id: UniqueEntityID;
  name?: string;
  // code e fullCode não podem ser alterados após criação
  description?: string;
  status?: ProductStatus;
  outOfLine?: boolean;
  // templateId não pode ser alterado após criação
  supplierId?: UniqueEntityID;
  manufacturerId?: UniqueEntityID;
  attributes?: Record<string, unknown>;
  categoryIds?: string[];
}

export interface ProductsRepository {
  create(data: CreateProductSchema): Promise<Product>;
  findById(id: UniqueEntityID): Promise<Product | null>;
  findByName(name: string): Promise<Product | null>;
  findMany(): Promise<Product[]>;
  findManyByStatus(status: ProductStatus): Promise<Product[]>;
  findManyByTemplate(templateId: UniqueEntityID): Promise<Product[]>;
  findManyByManufacturer(manufacturerId: UniqueEntityID): Promise<Product[]>;
  findManyByCategory(categoryId: UniqueEntityID): Promise<Product[]>;
  update(data: UpdateProductSchema): Promise<Product | null>;
  updateCareInstructions(
    productId: UniqueEntityID,
    careInstructionIds: string[],
  ): Promise<Product>;
  save(product: Product): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
  getNextSequentialCode(): Promise<number>;
}
