import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface ItemReservationProps {
  id: UniqueEntityID;
  itemId: UniqueEntityID;
  userId: UniqueEntityID;
  quantity: number;
  reason?: string;
  reference?: string;
  expiresAt: Date;
  releasedAt?: Date;
  createdAt: Date;
}

export class ItemReservation extends Entity<ItemReservationProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get itemId(): UniqueEntityID {
    return this.props.itemId;
  }

  get userId(): UniqueEntityID {
    return this.props.userId;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get reason(): string | undefined {
    return this.props.reason;
  }

  get reference(): string | undefined {
    return this.props.reference;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get releasedAt(): Date | undefined {
    return this.props.releasedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }

  get isReleased(): boolean {
    return !!this.props.releasedAt;
  }

  get isActive(): boolean {
    return !this.isReleased && !this.isExpired;
  }

  release() {
    if (this.isReleased) {
      throw new Error('Reservation already released');
    }
    this.props.releasedAt = new Date();
  }

  static create(
    props: Optional<ItemReservationProps, 'id' | 'createdAt'>,
    id?: UniqueEntityID,
  ): ItemReservation {
    const reservation = new ItemReservation(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return reservation;
  }
}
