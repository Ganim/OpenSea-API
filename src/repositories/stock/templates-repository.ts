import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Template } from '@/entities/stock/template';

export interface CreateTemplateSchema {
  name: string;
  productAttributes?: Record<string, unknown>;
  variantAttributes?: Record<string, unknown>;
  itemAttributes?: Record<string, unknown>;
}

export interface UpdateTemplateSchema {
  id: UniqueEntityID;
  name?: string;
  productAttributes?: Record<string, unknown>;
  variantAttributes?: Record<string, unknown>;
  itemAttributes?: Record<string, unknown>;
}

export interface TemplatesRepository {
  create(data: CreateTemplateSchema): Promise<Template>;
  findById(id: UniqueEntityID): Promise<Template | null>;
  findByName(name: string): Promise<Template | null>;
  findMany(): Promise<Template[]>;
  update(data: UpdateTemplateSchema): Promise<Template | null>;
  save(template: Template): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}
