import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ItemReservation } from '@/entities/sales/item-reservation';
import type { ItemReservation as PrismaItemReservation } from '@prisma/client';

export function mapItemReservationPrismaToDomain(
  reservationDb: PrismaItemReservation,
) {
  return {
    id: new UniqueEntityID(reservationDb.id),
    itemId: new UniqueEntityID(reservationDb.itemId),
    userId: new UniqueEntityID(reservationDb.userId),
    quantity: Number(reservationDb.quantity),
    reason: reservationDb.reason ?? undefined,
    reference: reservationDb.reference ?? undefined,
    expiresAt: reservationDb.expiresAt,
    releasedAt: reservationDb.releasedAt ?? undefined,
    createdAt: reservationDb.createdAt,
  };
}

export function itemReservationPrismaToDomain(
  reservationDb: PrismaItemReservation,
): ItemReservation {
  return ItemReservation.create(
    mapItemReservationPrismaToDomain(reservationDb),
    new UniqueEntityID(reservationDb.id),
  );
}
