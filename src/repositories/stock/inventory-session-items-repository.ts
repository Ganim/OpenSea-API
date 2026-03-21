import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { InventorySessionItem } from '@/entities/stock/inventory-session-item';

export interface CreateInventorySessionItemSchema {
  sessionId: UniqueEntityID;
  itemId: UniqueEntityID;
  expectedBinId?: UniqueEntityID;
  actualBinId?: UniqueEntityID;
  status?: 'PENDING' | 'CONFIRMED' | 'MISSING' | 'WRONG_BIN' | 'EXTRA';
  notes?: string;
}

export interface InventorySessionItemsRepository {
  create(data: CreateInventorySessionItemSchema): Promise<InventorySessionItem>;
  createMany(
    data: CreateInventorySessionItemSchema[],
  ): Promise<InventorySessionItem[]>;
  findById(id: UniqueEntityID): Promise<InventorySessionItem | null>;
  findBySessionAndItem(
    sessionId: UniqueEntityID,
    itemId: UniqueEntityID,
  ): Promise<InventorySessionItem | null>;
  findManyBySession(sessionId: UniqueEntityID): Promise<InventorySessionItem[]>;
  save(item: InventorySessionItem): Promise<void>;
}
