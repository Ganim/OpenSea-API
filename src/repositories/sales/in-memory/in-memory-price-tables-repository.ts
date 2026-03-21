import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PriceTable } from '@/entities/sales/price-table';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  CreatePriceTableSchema,
  FindManyPriceTablesParams,
  PriceTablesRepository,
  PriceTableRuleData,
  PriceTableWithRules,
  UpdatePriceTableSchema,
} from '@/repositories/sales/price-tables-repository';

export class InMemoryPriceTablesRepository implements PriceTablesRepository {
  public items: PriceTable[] = [];
  public rules: PriceTableRuleData[] = [];

  async create(data: CreatePriceTableSchema): Promise<PriceTable> {
    const priceTable = PriceTable.create({
      tenantId: new UniqueEntityID(data.tenantId),
      name: data.name,
      description: data.description,
      type: data.type,
      currency: data.currency,
      priceIncludesTax: data.priceIncludesTax,
      isDefault: data.isDefault,
      priority: data.priority,
      isActive: data.isActive,
      validFrom: data.validFrom,
      validUntil: data.validUntil,
    });

    this.items.push(priceTable);
    return priceTable;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PriceTable | null> {
    return (
      this.items.find(
        (pt) =>
          pt.id.toString() === id.toString() &&
          pt.tenantId.toString() === tenantId &&
          !pt.deletedAt,
      ) ?? null
    );
  }

  async findByName(
    name: string,
    tenantId: string,
  ): Promise<PriceTable | null> {
    return (
      this.items.find(
        (pt) =>
          pt.name.toLowerCase() === name.toLowerCase() &&
          pt.tenantId.toString() === tenantId &&
          !pt.deletedAt,
      ) ?? null
    );
  }

  async findDefault(tenantId: string): Promise<PriceTable | null> {
    return (
      this.items.find(
        (pt) =>
          pt.isDefault &&
          pt.tenantId.toString() === tenantId &&
          !pt.deletedAt,
      ) ?? null
    );
  }

  async findManyPaginated(
    params: FindManyPriceTablesParams,
  ): Promise<PaginatedResult<PriceTable>> {
    let filtered = this.items.filter(
      (pt) => pt.tenantId.toString() === params.tenantId && !pt.deletedAt,
    );

    if (params.type) {
      filtered = filtered.filter((pt) => pt.type === params.type);
    }

    if (params.isActive !== undefined) {
      filtered = filtered.filter((pt) => pt.isActive === params.isActive);
    }

    if (params.search) {
      const s = params.search.toLowerCase();
      filtered = filtered.filter((pt) =>
        pt.name.toLowerCase().includes(s),
      );
    }

    const total = filtered.length;
    const start = (params.page - 1) * params.limit;
    const data = filtered.slice(start, start + params.limit);

    return {
      data,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async findActiveWithRulesByTenant(tenantId: string): Promise<PriceTableWithRules[]> {
    const active = this.items
      .filter(
        (pt) =>
          pt.tenantId.toString() === tenantId &&
          pt.isActive &&
          !pt.deletedAt,
      )
      .sort((a, b) => b.priority - a.priority);

    return active.map((table) => ({
      table,
      rules: this.rules.filter(
        (r) => r.priceTableId === table.id.toString(),
      ),
    }));
  }

  async update(data: UpdatePriceTableSchema): Promise<PriceTable | null> {
    const index = this.items.findIndex(
      (pt) =>
        pt.id.toString() === data.id.toString() &&
        pt.tenantId.toString() === data.tenantId &&
        !pt.deletedAt,
    );

    if (index === -1) return null;

    const priceTable = this.items[index]!;
    if (data.name !== undefined) priceTable.name = data.name;
    if (data.description !== undefined) priceTable.description = data.description;
    if (data.type !== undefined) priceTable.type = data.type;
    if (data.currency !== undefined) priceTable.currency = data.currency;
    if (data.priceIncludesTax !== undefined) priceTable.priceIncludesTax = data.priceIncludesTax;
    if (data.isDefault !== undefined) priceTable.isDefault = data.isDefault;
    if (data.priority !== undefined) priceTable.priority = data.priority;
    if (data.isActive !== undefined) priceTable.isActive = data.isActive;
    if (data.validFrom !== undefined) priceTable.validFrom = data.validFrom;
    if (data.validUntil !== undefined) priceTable.validUntil = data.validUntil;

    return priceTable;
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    const pt = this.items.find(
      (item) =>
        item.id.toString() === id.toString() &&
        item.tenantId.toString() === tenantId,
    );
    if (pt) {
      pt.delete();
    }
  }
}
