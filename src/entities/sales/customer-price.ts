import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface CustomerPriceProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  customerId: UniqueEntityID;
  variantId: UniqueEntityID;
  price: number;
  validFrom?: Date;
  validUntil?: Date;
  notes?: string;
  createdByUserId: UniqueEntityID;
  createdAt: Date;
  updatedAt?: Date;
}

export class CustomerPrice extends Entity<CustomerPriceProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get customerId(): UniqueEntityID {
    return this.props.customerId;
  }

  get variantId(): UniqueEntityID {
    return this.props.variantId;
  }

  get price(): number {
    return this.props.price;
  }

  set price(value: number) {
    this.props.price = value;
    this.touch();
  }

  get validFrom(): Date | undefined {
    return this.props.validFrom;
  }

  set validFrom(value: Date | undefined) {
    this.props.validFrom = value;
    this.touch();
  }

  get validUntil(): Date | undefined {
    return this.props.validUntil;
  }

  set validUntil(value: Date | undefined) {
    this.props.validUntil = value;
    this.touch();
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  set notes(value: string | undefined) {
    this.props.notes = value;
    this.touch();
  }

  get createdByUserId(): UniqueEntityID {
    return this.props.createdByUserId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<CustomerPriceProps, 'id' | 'createdAt'>,
    id?: UniqueEntityID,
  ): CustomerPrice {
    const customerPrice = new CustomerPrice(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return customerPrice;
  }
}
