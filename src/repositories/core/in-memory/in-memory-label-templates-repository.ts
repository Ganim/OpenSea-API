import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { LabelTemplate } from '@/entities/core/label-template';
import type {
  CreateLabelTemplateSchema,
  LabelTemplatesRepository,
  ListLabelTemplatesFilters,
  ListLabelTemplatesResult,
  UpdateLabelTemplateSchema,
} from '../label-templates-repository';

export class InMemoryLabelTemplatesRepository
  implements LabelTemplatesRepository
{
  public items: LabelTemplate[] = [];

  async create(data: CreateLabelTemplateSchema): Promise<LabelTemplate> {
    const labelTemplate = LabelTemplate.create({
      name: data.name,
      description: data.description,
      isSystem: data.isSystem ?? false,
      width: data.width,
      height: data.height,
      grapesJsData: data.grapesJsData,
      compiledHtml: data.compiledHtml,
      compiledCss: data.compiledCss,
      thumbnailUrl: data.thumbnailUrl,
      tenantId: data.tenantId,
      createdById: data.createdById,
    });

    this.items.push(labelTemplate);
    return labelTemplate;
  }

  async findById(
    tenantId: UniqueEntityID,
    id: UniqueEntityID,
  ): Promise<LabelTemplate | null> {
    const labelTemplate = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.id.equals(id) &&
        (item.tenantId.equals(tenantId) || item.isSystem),
    );
    return labelTemplate ?? null;
  }

  async findByNameAndTenant(
    name: string,
    tenantId: UniqueEntityID,
  ): Promise<LabelTemplate | null> {
    const labelTemplate = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.name === name &&
        item.tenantId.equals(tenantId),
    );
    return labelTemplate ?? null;
  }

  async findMany(
    filters: ListLabelTemplatesFilters,
  ): Promise<ListLabelTemplatesResult> {
    let filteredItems = this.items.filter((item) => {
      if (item.deletedAt) return false;

      const matchesTenant = item.tenantId.equals(
        filters.tenantId,
      );
      const matchesSystem = filters.includeSystem ? true : !item.isSystem;

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          item.name.toLowerCase().includes(searchLower) ||
          (item.description?.toLowerCase().includes(searchLower) ?? false);
        return matchesTenant && matchesSystem && matchesSearch;
      }

      return matchesTenant && matchesSystem;
    });

    if (filters.includeSystem) {
      const systemTemplates = this.items.filter(
        (item) => !item.deletedAt && item.isSystem,
      );
      filteredItems = [
        ...new Map(
          [...filteredItems, ...systemTemplates].map((item) => [
            item.id.toString(),
            item,
          ]),
        ).values(),
      ];
    }

    const total = filteredItems.length;
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 50;
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      templates: filteredItems.slice(start, end),
      total,
    };
  }

  async findSystemTemplates(): Promise<LabelTemplate[]> {
    return this.items.filter((item) => !item.deletedAt && item.isSystem);
  }

  async update(data: UpdateLabelTemplateSchema): Promise<LabelTemplate | null> {
    const labelTemplate = await this.findById(data.tenantId, data.id);
    if (!labelTemplate) return null;

    if (labelTemplate.isSystem) {
      return null;
    }

    if (data.name !== undefined) labelTemplate.name = data.name;
    if (data.description !== undefined)
      labelTemplate.description = data.description;
    if (data.width !== undefined) labelTemplate.width = data.width;
    if (data.height !== undefined) labelTemplate.height = data.height;
    if (data.grapesJsData !== undefined)
      labelTemplate.grapesJsData = data.grapesJsData;
    if (data.compiledHtml !== undefined)
      labelTemplate.compiledHtml = data.compiledHtml;
    if (data.compiledCss !== undefined)
      labelTemplate.compiledCss = data.compiledCss;
    if (data.thumbnailUrl !== undefined)
      labelTemplate.thumbnailUrl = data.thumbnailUrl;

    return labelTemplate;
  }

  async save(labelTemplate: LabelTemplate): Promise<void> {
    const index = this.items.findIndex((i) => i.id.equals(labelTemplate.id));
    if (index >= 0) {
      this.items[index] = labelTemplate;
    } else {
      this.items.push(labelTemplate);
    }
  }

  async delete(
    tenantId: UniqueEntityID,
    id: UniqueEntityID,
  ): Promise<void> {
    const labelTemplate = await this.findById(tenantId, id);
    if (labelTemplate && !labelTemplate.isSystem) {
      labelTemplate.delete();
    }
  }
}
