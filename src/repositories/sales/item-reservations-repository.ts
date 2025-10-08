import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ItemReservation } from '@/entities/sales/item-reservation';

export interface CreateItemReservationSchema {
  itemId: UniqueEntityID;
  userId: UniqueEntityID;
  quantity: number;
  reason?: string;
  reference?: string;
  expiresAt: Date;
}

export interface ItemReservationsRepository {
  create(data: CreateItemReservationSchema): Promise<ItemReservation>;
  findById(id: UniqueEntityID): Promise<ItemReservation | null>;
  findManyByItem(itemId: UniqueEntityID): Promise<ItemReservation[]>;
  findManyByUser(userId: UniqueEntityID): Promise<ItemReservation[]>;
  findManyActive(itemId: UniqueEntityID): Promise<ItemReservation[]>;
  findManyExpired(): Promise<ItemReservation[]>;
  save(reservation: ItemReservation): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}
