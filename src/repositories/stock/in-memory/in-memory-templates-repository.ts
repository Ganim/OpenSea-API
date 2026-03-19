import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Template } from '@/entities/stock/template';
import type { PaginatedResult, PaginationParams } from '../../pagination-params';
import type {
  CreateTemplateSchema,
  TemplatesRepository,
  UpdateTemplateSchema,
} from '../templates-repository';

export class InMemoryTemplatesRepository implements TemplatesRepository {
  public items: Template[] = [];
  private sequentialCounter = 0;

  async create(data: CreateTemplateSchema): Promise<Template> {
    this.sequentialCounter += 1;
    const sequentialCode = this.sequentialCounter;
    // Use provided code or generate from sequentialCode
    const code = data.code ?? sequentialCode.toString().padStart(3, '0');

    const template = Template.create({
      tenantId: new EntityID(data.tenantId),
      code,
      sequentialCode,
      name: data.name,
      iconUrl: data.iconUrl,
      unitOfMeasure: data.unitOfMeasure,
      productAttributes: data.productAttributes ?? {},
      variantAttributes: data.variantAttributes ?? {},
      itemAttributes: data.itemAttributes ?? {},
      specialModules: data.specialModules ?? [],
    });

    this.items.push(template);
    return template;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Template | null> {
    const template = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.id.equals(id) &&
        item.tenantId.toString() === tenantId,
    );
    return template ?? null;
  }

  async findByName(name: string, tenantId: string): Promise<Template | null> {
    const template = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.name === name &&
        item.tenantId.toString() === tenantId,
    );
    return template ?? null;
  }

  async findMany(tenantId: string): Promise<Template[]> {
    return this.items.filter(
      (item) => !item.deletedAt && item.tenantId.toString() === tenantId,
    );
  }

  async findManyPaginated(
    tenantId: string,
    params: PaginationParams & {
      search?: string;
      sortBy?: 'name' | 'createdAt' | 'updatedAt';
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<PaginatedResult<Template>> {
    let filtered = this.items.filter(
      (item) => !item.deletedAt && item.tenantId.toString() === tenantId,
    );

    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(searchLower),
      );
    }

    const sortBy = params.sortBy ?? 'name';
    const sortOrder = params.sortOrder ?? 'asc';
    filtered.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    const total = filtered.length;
    const start = (params.page - 1) * params.limit;
    const paginated = filtered.slice(start, start + params.limit);

    return {
      data: paginated,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async update(data: UpdateTemplateSchema): Promise<Template | null> {
    const template = this.items.find(
      (item) => !item.deletedAt && item.id.equals(data.id),
    );
    if (!template) return null;

    if (data.name !== undefined) template.name = data.name;
    if (data.iconUrl !== undefined) template.iconUrl = data.iconUrl;
    if (data.unitOfMeasure !== undefined)
      template.unitOfMeasure = data.unitOfMeasure;
    if (data.productAttributes !== undefined)
      template.productAttributes = data.productAttributes;
    if (data.variantAttributes !== undefined)
      template.variantAttributes = data.variantAttributes;
    if (data.itemAttributes !== undefined)
      template.itemAttributes = data.itemAttributes;
    if (data.specialModules !== undefined)
      template.specialModules = data.specialModules;
    if (data.isActive !== undefined) template.isActive = data.isActive;

    return template;
  }

  async save(template: Template): Promise<void> {
    const index = this.items.findIndex((i) => i.id.equals(template.id));
    if (index >= 0) {
      this.items[index] = template;
    } else {
      this.items.push(template);
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const template = this.items.find(
      (item) => !item.deletedAt && item.id.equals(id),
    );
    if (template) {
      template.delete();
    }
  }
}
