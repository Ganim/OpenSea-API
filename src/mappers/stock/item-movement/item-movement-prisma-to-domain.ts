import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ItemMovement } from '@/entities/stock/item-movement';
import { MovementType } from '@/entities/stock/value-objects/movement-type';
import type { ItemMovement as PrismaItemMovement } from '@prisma/generated/client.js';

export function mapItemMovementPrismaToDomain(movementDb: PrismaItemMovement) {
  return {
    id: new UniqueEntityID(movementDb.id),
    tenantId: new UniqueEntityID(movementDb.tenantId),
    itemId: new UniqueEntityID(movementDb.itemId),
    quantity: Number(movementDb.quantity.toString()),
    quantityBefore: movementDb.quantityBefore
      ? Number(movementDb.quantityBefore.toString())
      : undefined,
    quantityAfter: movementDb.quantityAfter
      ? Number(movementDb.quantityAfter.toString())
      : undefined,
    movementType: MovementType.create(movementDb.movementType),
    reasonCode: movementDb.reasonCode ?? undefined,
    destinationRef: movementDb.destinationRef ?? undefined,
    batchNumber: movementDb.batchNumber ?? undefined,
    notes: movementDb.notes ?? undefined,
    userId: new UniqueEntityID(movementDb.userId),
    approvedBy: movementDb.approvedBy
      ? new UniqueEntityID(movementDb.approvedBy)
      : undefined,
    salesOrderId: movementDb.salesOrderId
      ? new UniqueEntityID(movementDb.salesOrderId)
      : undefined,
    createdAt: movementDb.createdAt,
  };
}

export function itemMovementPrismaToDomain(
  movementDb: PrismaItemMovement,
): ItemMovement {
  return ItemMovement.create(
    mapItemMovementPrismaToDomain(movementDb),
    new UniqueEntityID(movementDb.id),
  );
}
