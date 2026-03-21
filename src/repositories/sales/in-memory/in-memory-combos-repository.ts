import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Combo } from '@/entities/sales/combo';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  CombosRepository,
  CreateComboSchema,
  FindManyCombosParams,
  UpdateComboSchema,
} from '../combos-repository';

export class InMemoryCombosRepository implements CombosRepository {
  public items: Combo[] = [];

  async create(data: CreateComboSchema): Promise<Combo> {
    const combo = Combo.create({
      tenantId: new EntityID(data.tenantId),
      name: data.name,
      description: data.description,
      type: data.type,
      discountType: data.discountType,
      discountValue: data.discountValue,
      isActive: data.isActive ?? true,
      startDate: data.startDate,
      endDate: data.endDate,
      items: data.items ?? [],
      categoryIds: data.categoryIds ?? [],
      minItems: data.minItems,
      maxItems: data.maxItems,
    });

    this.items.push(combo);
    return combo;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Combo | null> {
    const combo = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.id.equals(id) &&
        item.tenantId.toString() === tenantId,
    );
    return combo ?? null;
  }

  async findManyPaginated(
    params: FindManyCombosParams,
  ): Promise<PaginatedResult<Combo>> {
    let filtered = this.items.filter(
      (item) =>
        !item.deletedAt && item.tenantId.toString() === params.tenantId,
    );

    if (params.isActive !== undefined) {
      filtered = filtered.filter((item) => item.isActive === params.isActive);
    }

    if (params.type) {
      filtered = filtered.filter((item) => item.type === params.type);
    }

    if (params.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(search) ||
          item.description?.toLowerCase().includes(search),
      );
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / params.limit);
    const start = (params.page - 1) * params.limit;
    const data = filtered.slice(start, start + params.limit);

    return { data, total, page: params.page, limit: params.limit, totalPages };
  }

  async update(data: UpdateComboSchema): Promise<Combo | null> {
    const combo = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.id.equals(data.id) &&
        item.tenantId.toString() === data.tenantId,
    );
    if (!combo) return null;

    if (data.name !== undefined) combo.name = data.name;
    if (data.description !== undefined) combo.description = data.description;
    if (data.isActive !== undefined) combo.isActive = data.isActive;

    return combo;
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    const combo = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.id.equals(id) &&
        item.tenantId.toString() === tenantId,
    );
    if (combo) {
      combo.delete();
    }
  }
}
