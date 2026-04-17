import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PPEItem } from '@/entities/hr/ppe-item';
import type {
  CreatePPEItemSchema,
  FindPPEItemFilters,
  UpdatePPEItemSchema,
  AdjustPPEItemStockSchema,
  PPEItemsRepository,
} from '../ppe-items-repository';

export class InMemoryPPEItemsRepository implements PPEItemsRepository {
  private items: PPEItem[] = [];

  async create(data: CreatePPEItemSchema): Promise<PPEItem> {
    const id = new UniqueEntityID();
    const ppeItem = PPEItem.create(
      {
        tenantId: new UniqueEntityID(data.tenantId),
        name: data.name,
        category: data.category as PPEItem['category'],
        caNumber: data.caNumber,
        manufacturer: data.manufacturer,
        model: data.model,
        expirationMonths: data.expirationMonths,
        minStock: data.minStock ?? 0,
        currentStock: data.currentStock ?? 0,
        isActive: data.isActive ?? true,
        notes: data.notes,
      },
      id,
    );

    this.items.push(ppeItem);
    return ppeItem;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PPEItem | null> {
    const ppeItem = this.items.find(
      (item) =>
        item.id.equals(id) &&
        item.tenantId.toString() === tenantId &&
        !item.deletedAt,
    );
    return ppeItem || null;
  }

  async findMany(
    tenantId: string,
    filters?: FindPPEItemFilters,
  ): Promise<{ ppeItems: PPEItem[]; total: number }> {
    let filteredItems = this.items.filter(
      (item) => item.tenantId.toString() === tenantId && !item.deletedAt,
    );

    if (filters?.category) {
      filteredItems = filteredItems.filter(
        (item) => item.category === filters.category,
      );
    }

    if (filters?.isActive !== undefined) {
      filteredItems = filteredItems.filter(
        (item) => item.isActive === filters.isActive,
      );
    }

    if (filters?.lowStockOnly) {
      filteredItems = filteredItems.filter((item) => item.isLowStock());
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredItems = filteredItems.filter(
        (item) =>
          item.name.toLowerCase().includes(searchLower) ||
          item.caNumber?.toLowerCase().includes(searchLower) ||
          item.manufacturer?.toLowerCase().includes(searchLower),
      );
    }

    const total = filteredItems.length;
    const page = filters?.page ?? 1;
    const perPage = filters?.perPage ?? 20;
    const start = (page - 1) * perPage;

    return {
      ppeItems: filteredItems.slice(start, start + perPage),
      total,
    };
  }

  async update(data: UpdatePPEItemSchema): Promise<PPEItem | null> {
    const index = this.items.findIndex(
      (item) =>
        item.id.equals(data.id) &&
        (!data.tenantId || item.tenantId.toString() === data.tenantId),
    );
    if (index === -1) return null;

    const existing = this.items[index];

    const updatedItem = PPEItem.create(
      {
        tenantId: existing.tenantId,
        name: data.name ?? existing.name,
        category: (data.category as PPEItem['category']) ?? existing.category,
        caNumber:
          data.caNumber === null
            ? undefined
            : (data.caNumber ?? existing.caNumber),
        manufacturer:
          data.manufacturer === null
            ? undefined
            : (data.manufacturer ?? existing.manufacturer),
        model: data.model === null ? undefined : (data.model ?? existing.model),
        expirationMonths:
          data.expirationMonths === null
            ? undefined
            : (data.expirationMonths ?? existing.expirationMonths),
        minStock: data.minStock ?? existing.minStock,
        currentStock: existing.currentStock,
        isActive: data.isActive ?? existing.isActive,
        notes: data.notes === null ? undefined : (data.notes ?? existing.notes),
        createdAt: existing.createdAt,
        deletedAt: existing.deletedAt,
      },
      existing.id,
    );

    this.items[index] = updatedItem;
    return updatedItem;
  }

  async adjustStock(data: AdjustPPEItemStockSchema): Promise<PPEItem | null> {
    const index = this.items.findIndex((item) => item.id.equals(data.id));
    if (index === -1) return null;

    const existing = this.items[index];
    const newStock = existing.currentStock + data.adjustment;

    const updatedItem = PPEItem.create(
      {
        tenantId: existing.tenantId,
        name: existing.name,
        category: existing.category,
        caNumber: existing.caNumber,
        manufacturer: existing.manufacturer,
        model: existing.model,
        expirationMonths: existing.expirationMonths,
        minStock: existing.minStock,
        currentStock: newStock < 0 ? 0 : newStock,
        isActive: existing.isActive,
        notes: existing.notes,
        createdAt: existing.createdAt,
        deletedAt: existing.deletedAt,
      },
      existing.id,
    );

    this.items[index] = updatedItem;
    return updatedItem;
  }

  /**
   * Single-threaded JavaScript guarantees that between the find and the
   * splice below no other continuation can interleave, so the in-memory
   * implementation is trivially atomic. We still guard against
   * currentStock < quantity so tests can simulate the "insufficient stock"
   * branch deterministically.
   */
  async atomicDecrementStock(
    itemId: UniqueEntityID,
    quantity: number,
    tenantId: string,
  ): Promise<{ count: number }> {
    const index = this.items.findIndex(
      (item) =>
        item.id.equals(itemId) &&
        item.tenantId.toString() === tenantId &&
        item.currentStock >= quantity,
    );
    if (index === -1) return { count: 0 };

    const existing = this.items[index];
    const updatedItem = PPEItem.create(
      {
        tenantId: existing.tenantId,
        name: existing.name,
        category: existing.category,
        caNumber: existing.caNumber,
        manufacturer: existing.manufacturer,
        model: existing.model,
        expirationMonths: existing.expirationMonths,
        minStock: existing.minStock,
        currentStock: existing.currentStock - quantity,
        isActive: existing.isActive,
        notes: existing.notes,
        createdAt: existing.createdAt,
        deletedAt: existing.deletedAt,
      },
      existing.id,
    );

    this.items[index] = updatedItem;
    return { count: 1 };
  }

  async softDelete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(id));
    if (index !== -1) {
      const existing = this.items[index];
      const deletedItem = PPEItem.create(
        {
          tenantId: existing.tenantId,
          name: existing.name,
          category: existing.category,
          caNumber: existing.caNumber,
          manufacturer: existing.manufacturer,
          model: existing.model,
          expirationMonths: existing.expirationMonths,
          minStock: existing.minStock,
          currentStock: existing.currentStock,
          isActive: existing.isActive,
          notes: existing.notes,
          createdAt: existing.createdAt,
          deletedAt: new Date(),
        },
        existing.id,
      );
      this.items[index] = deletedItem;
    }
  }

  clear(): void {
    this.items = [];
  }
}
