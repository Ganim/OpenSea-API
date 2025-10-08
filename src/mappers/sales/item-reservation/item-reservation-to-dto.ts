import type { ItemReservation } from '@/entities/sales/item-reservation';

export interface ItemReservationDTO {
  id: string;
  itemId: string;
  userId: string;
  quantity: number;
  reason?: string;
  reference?: string;
  expiresAt: Date;
  releasedAt?: Date;
  isExpired: boolean;
  isReleased: boolean;
  isActive: boolean;
  createdAt: Date;
}

export function itemReservationToDTO(
  reservation: ItemReservation,
): ItemReservationDTO {
  return {
    id: reservation.id.toString(),
    itemId: reservation.itemId.toString(),
    userId: reservation.userId.toString(),
    quantity: reservation.quantity,
    reason: reservation.reason,
    reference: reservation.reference,
    expiresAt: reservation.expiresAt,
    releasedAt: reservation.releasedAt,
    isExpired: reservation.isExpired,
    isReleased: reservation.isReleased,
    isActive: reservation.isActive,
    createdAt: reservation.createdAt,
  };
}
