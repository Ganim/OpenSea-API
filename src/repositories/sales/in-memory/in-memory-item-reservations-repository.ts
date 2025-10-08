import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ItemReservation } from '@/entities/sales/item-reservation';
import type {
  CreateItemReservationSchema,
  ItemReservationsRepository,
} from '../item-reservations-repository';

export class InMemoryItemReservationsRepository
  implements ItemReservationsRepository
{
  public items: ItemReservation[] = [];

  async create(data: CreateItemReservationSchema): Promise<ItemReservation> {
    const reservation = ItemReservation.create({
      itemId: data.itemId,
      userId: data.userId,
      quantity: data.quantity,
      reason: data.reason,
      reference: data.reference,
      expiresAt: data.expiresAt,
    });

    this.items.push(reservation);
    return reservation;
  }

  async findById(id: UniqueEntityID): Promise<ItemReservation | null> {
    const reservation = this.items.find((item) => item.id.equals(id));
    return reservation ?? null;
  }

  async findManyByItem(itemId: UniqueEntityID): Promise<ItemReservation[]> {
    return this.items.filter((item) => item.itemId.equals(itemId));
  }

  async findManyByUser(userId: UniqueEntityID): Promise<ItemReservation[]> {
    return this.items.filter((item) => item.userId.equals(userId));
  }

  async findManyActive(itemId: UniqueEntityID): Promise<ItemReservation[]> {
    return this.items.filter(
      (item) => item.itemId.equals(itemId) && item.isActive,
    );
  }

  async findManyExpired(): Promise<ItemReservation[]> {
    return this.items.filter((item) => item.isExpired && !item.isReleased);
  }

  async save(reservation: ItemReservation): Promise<void> {
    const index = this.items.findIndex((item) =>
      item.id.equals(reservation.id),
    );

    if (index >= 0) {
      this.items[index] = reservation;
    } else {
      this.items.push(reservation);
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const reservation = await this.findById(id);

    if (reservation && !reservation.isReleased) {
      reservation.release();
    }
  }
}
