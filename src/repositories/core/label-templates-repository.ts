import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { LabelTemplate } from '@/entities/core/label-template';

export interface CreateLabelTemplateSchema {
  name: string;
  description?: string;
  isSystem?: boolean;
  width: number;
  height: number;
  grapesJsData: string;
  compiledHtml?: string;
  compiledCss?: string;
  thumbnailUrl?: string;
  tenantId: UniqueEntityID;
  createdById: UniqueEntityID;
}

export interface UpdateLabelTemplateSchema {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  name?: string;
  description?: string;
  width?: number;
  height?: number;
  grapesJsData?: string;
  compiledHtml?: string;
  compiledCss?: string;
  thumbnailUrl?: string;
}

export interface ListLabelTemplatesFilters {
  tenantId: UniqueEntityID;
  includeSystem?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ListLabelTemplatesResult {
  templates: LabelTemplate[];
  total: number;
}

export interface LabelTemplatesRepository {
  create(data: CreateLabelTemplateSchema): Promise<LabelTemplate>;
  findById(
    tenantId: UniqueEntityID,
    id: UniqueEntityID,
  ): Promise<LabelTemplate | null>;
  findByNameAndTenant(
    name: string,
    tenantId: UniqueEntityID,
  ): Promise<LabelTemplate | null>;
  findMany(
    filters: ListLabelTemplatesFilters,
  ): Promise<ListLabelTemplatesResult>;
  findSystemTemplates(): Promise<LabelTemplate[]>;
  update(data: UpdateLabelTemplateSchema): Promise<LabelTemplate | null>;
  save(labelTemplate: LabelTemplate): Promise<void>;
  delete(tenantId: UniqueEntityID, id: UniqueEntityID): Promise<void>;
}
