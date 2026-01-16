import type { LabelTemplate } from '@/entities/core/label-template';

export interface LabelTemplateDTO {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  width: number;
  height: number;
  grapesJsData: string;
  compiledHtml: string | null;
  compiledCss: string | null;
  thumbnailUrl: string | null;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date | null;
}

export function labelTemplateToDTO(labelTemplate: LabelTemplate): LabelTemplateDTO {
  return {
    id: labelTemplate.id.toString(),
    name: labelTemplate.name,
    description: labelTemplate.description ?? null,
    isSystem: labelTemplate.isSystem,
    width: labelTemplate.width,
    height: labelTemplate.height,
    grapesJsData: labelTemplate.grapesJsData,
    compiledHtml: labelTemplate.compiledHtml ?? null,
    compiledCss: labelTemplate.compiledCss ?? null,
    thumbnailUrl: labelTemplate.thumbnailUrl ?? null,
    organizationId: labelTemplate.organizationId.toString(),
    createdBy: labelTemplate.createdById.toString(),
    createdAt: labelTemplate.createdAt,
    updatedAt: labelTemplate.updatedAt ?? null,
  };
}
