import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  ContractTemplate,
  type ContractTemplateTypeValue,
} from '@/entities/hr/contract-template';
import type {
  ContractTemplatesRepository,
  CreateContractTemplateSchema,
  FindManyContractTemplatesParams,
  FindManyContractTemplatesResult,
  UpdateContractTemplateSchema,
} from '../contract-templates-repository';

export class InMemoryContractTemplatesRepository
  implements ContractTemplatesRepository
{
  public items: ContractTemplate[] = [];

  async create(data: CreateContractTemplateSchema): Promise<ContractTemplate> {
    const id = new UniqueEntityID();
    const template = ContractTemplate.create(
      {
        tenantId: new UniqueEntityID(data.tenantId),
        name: data.name,
        type: data.type,
        content: data.content,
        isActive: data.isActive ?? true,
        isDefault: data.isDefault ?? false,
      },
      id,
    );

    this.items.push(template);
    return template;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ContractTemplate | null> {
    const template = this.items.find(
      (item) =>
        item.id.equals(id) &&
        item.tenantId.toString() === tenantId &&
        !item.deletedAt,
    );
    return template ?? null;
  }

  async findDefaultByType(
    type: ContractTemplateTypeValue,
    tenantId: string,
  ): Promise<ContractTemplate | null> {
    const template = this.items.find(
      (item) =>
        item.type === type &&
        item.isDefault &&
        item.isActive &&
        item.tenantId.toString() === tenantId &&
        !item.deletedAt,
    );
    return template ?? null;
  }

  async findMany(
    params: FindManyContractTemplatesParams,
  ): Promise<FindManyContractTemplatesResult> {
    const { tenantId, page = 1, perPage = 20, search, type, isActive } = params;

    let filtered = this.items.filter(
      (item) => item.tenantId.toString() === tenantId && !item.deletedAt,
    );

    if (search) {
      const needle = search.toLowerCase();
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(needle),
      );
    }

    if (type) {
      filtered = filtered.filter((item) => item.type === type);
    }

    if (isActive !== undefined) {
      filtered = filtered.filter((item) => item.isActive === isActive);
    }

    const total = filtered.length;
    const start = (page - 1) * perPage;
    const templates = filtered
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(start, start + perPage);

    return { templates, total };
  }

  async update(
    data: UpdateContractTemplateSchema,
  ): Promise<ContractTemplate | null> {
    const index = this.items.findIndex(
      (item) => item.id.equals(data.id) && !item.deletedAt,
    );
    if (index === -1) return null;

    const existing = this.items[index];

    if (data.name !== undefined) existing.rename(data.name);
    if (data.content !== undefined) existing.updateContent(data.content);
    if (data.type !== undefined) existing.changeType(data.type);
    if (data.isActive !== undefined) {
      if (data.isActive) {
        existing.activate();
      } else {
        existing.deactivate();
      }
    }
    if (data.isDefault !== undefined) {
      if (data.isDefault) {
        existing.markAsDefault();
      } else {
        existing.unmarkAsDefault();
      }
    }

    return existing;
  }

  async save(template: ContractTemplate): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(template.id));
    if (index !== -1) {
      this.items[index] = template;
    } else {
      this.items.push(template);
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(id));
    if (index !== -1) {
      this.items[index].softDelete();
    }
  }

  clear(): void {
    this.items = [];
  }
}
