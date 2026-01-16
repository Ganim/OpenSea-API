import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Item } from '@/entities/stock/item';
import { ItemStatus } from '@/entities/stock/value-objects/item-status';
import type { Item as PrismaItem } from '@prisma/client';

export function mapItemPrismaToDomain(itemDb: PrismaItem) {
  return {
    id: new UniqueEntityID(itemDb.id),
    variantId: new UniqueEntityID(itemDb.variantId),
    binId: itemDb.binId ? new UniqueEntityID(itemDb.binId) : undefined,
    uniqueCode: itemDb.uniqueCode ?? undefined,
    fullCode: itemDb.fullCode ?? undefined,
    sequentialCode: itemDb.sequentialCode ?? undefined,
    initialQuantity: Number(itemDb.initialQuantity.toString()),
    currentQuantity: Number(itemDb.currentQuantity.toString()),
    unitCost: itemDb.unitCost ? Number(itemDb.unitCost.toString()) : undefined,
    status: ItemStatus.create(itemDb.status),
    entryDate: itemDb.entryDate,
    attributes: itemDb.attributes as Record<string, unknown>,
    batchNumber: itemDb.batchNumber ?? undefined,
    manufacturingDate: itemDb.manufacturingDate ?? undefined,
    expiryDate: itemDb.expiryDate ?? undefined,
    createdAt: itemDb.createdAt,
    updatedAt: itemDb.updatedAt,
    deletedAt: itemDb.deletedAt ?? undefined,
  };
}

export function itemPrismaToDomain(itemDb: PrismaItem): Item {
  return Item.create(
    mapItemPrismaToDomain(itemDb),
    new UniqueEntityID(itemDb.id),
  );
}
