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
  organizationId: UniqueEntityID;
  createdById: UniqueEntityID;
}

export interface UpdateLabelTemplateSchema {
  id: UniqueEntityID;
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
  organizationId: UniqueEntityID;
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
  findById(id: UniqueEntityID): Promise<LabelTemplate | null>;
  findByNameAndOrganization(
    name: string,
    organizationId: UniqueEntityID,
  ): Promise<LabelTemplate | null>;
  findMany(filters: ListLabelTemplatesFilters): Promise<ListLabelTemplatesResult>;
  findSystemTemplates(): Promise<LabelTemplate[]>;
  update(data: UpdateLabelTemplateSchema): Promise<LabelTemplate | null>;
  save(labelTemplate: LabelTemplate): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}
