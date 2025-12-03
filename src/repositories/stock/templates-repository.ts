import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CareLabelInfo } from '@/entities/stock/template';
import { Template } from '@/entities/stock/template';
import type { UnitOfMeasure } from '@/entities/stock/value-objects/unit-of-measure';

export interface CreateTemplateSchema {
  name: string;
  unitOfMeasure: UnitOfMeasure;
  productAttributes?: Record<string, unknown>;
  variantAttributes?: Record<string, unknown>;
  itemAttributes?: Record<string, unknown>;
  careLabel?: CareLabelInfo;
}

export interface UpdateTemplateSchema {
  id: UniqueEntityID;
  name?: string;
  unitOfMeasure?: UnitOfMeasure;
  productAttributes?: Record<string, unknown>;
  variantAttributes?: Record<string, unknown>;
  itemAttributes?: Record<string, unknown>;
  careLabel?: CareLabelInfo;
  isActive?: boolean;
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
