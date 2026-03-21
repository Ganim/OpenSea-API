import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface PriceTableItemProps {
  id: UniqueEntityID;
  priceTableId: UniqueEntityID;
  tenantId: UniqueEntityID;
  variantId: UniqueEntityID;
  price: number;
  minQuantity: number;
  maxQuantity?: number;
  costPrice?: number;
  marginPercent?: number;
  createdAt: Date;
  updatedAt?: Date;
}

export class PriceTableItem extends Entity<PriceTableItemProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get priceTableId(): UniqueEntityID {
    return this.props.priceTableId;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
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

  get minQuantity(): number {
    return this.props.minQuantity;
  }

  set minQuantity(value: number) {
    this.props.minQuantity = value;
    this.touch();
  }

  get maxQuantity(): number | undefined {
    return this.props.maxQuantity;
  }

  set maxQuantity(value: number | undefined) {
    this.props.maxQuantity = value;
    this.touch();
  }

  get costPrice(): number | undefined {
    return this.props.costPrice;
  }

  set costPrice(value: number | undefined) {
    this.props.costPrice = value;
    this.touch();
  }

  get marginPercent(): number | undefined {
    return this.props.marginPercent;
  }

  set marginPercent(value: number | undefined) {
    this.props.marginPercent = value;
    this.touch();
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
    props: Optional<PriceTableItemProps, 'id' | 'createdAt' | 'minQuantity'>,
    id?: UniqueEntityID,
  ): PriceTableItem {
    const item = new PriceTableItem(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        minQuantity: props.minQuantity ?? 1,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return item;
  }
}
