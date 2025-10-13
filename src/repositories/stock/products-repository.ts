import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Product } from '@/entities/stock/product';
import { ProductStatus } from '@/entities/stock/value-objects/product-status';
import { UnitOfMeasure } from '@/entities/stock/value-objects/unit-of-measure';

export interface CreateProductSchema {
  name: string;
  code: string;
  description?: string;
  status: ProductStatus;
  unitOfMeasure: UnitOfMeasure;
  templateId: UniqueEntityID; // Obrigatório
  supplierId?: UniqueEntityID;
  manufacturerId?: UniqueEntityID;
  attributes?: Record<string, unknown>;
}

export interface UpdateProductSchema {
  id: UniqueEntityID;
  name?: string;
  code?: string;
  description?: string;
  status?: ProductStatus;
  unitOfMeasure?: UnitOfMeasure;
  // templateId não pode ser alterado após criação
  supplierId?: UniqueEntityID;
  manufacturerId?: UniqueEntityID;
  attributes?: Record<string, unknown>;
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
  save(product: Product): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}
