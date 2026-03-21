import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type PriceSourceType =
  | 'CUSTOMER'
  | 'CAMPAIGN'
  | 'COUPON'
  | 'QUANTITY_TIER'
  | 'TABLE'
  | 'DEFAULT'
  | 'MANUAL';

export interface OrderItemProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  orderId: UniqueEntityID;
  variantId?: UniqueEntityID;
  comboId?: UniqueEntityID;

  // Description (snapshot)
  name: string;
  sku?: string;
  description?: string;

  // Pricing
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  discountValue: number;
  subtotal: number;

  // Tax
  taxIcms: number;
  taxIpi: number;
  taxPis: number;
  taxCofins: number;
  taxTotal: number;
  ncm?: string;
  cfop?: string;

  // Fulfillment
  quantityDelivered: number;
  quantityReturned: number;

  // Pricing source
  priceSource: PriceSourceType;
  priceSourceId?: string;

  position: number;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export class OrderItem extends Entity<OrderItemProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get orderId(): UniqueEntityID {
    return this.props.orderId;
  }

  get variantId(): UniqueEntityID | undefined {
    return this.props.variantId;
  }

  get comboId(): UniqueEntityID | undefined {
    return this.props.comboId;
  }

  get name(): string {
    return this.props.name;
  }

  get sku(): string | undefined {
    return this.props.sku;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  set quantity(value: number) {
    if (value <= 0) {
      throw new Error('Quantity must be greater than zero');
    }
    this.props.quantity = value;
    this.recalculateSubtotal();
  }

  get unitPrice(): number {
    return this.props.unitPrice;
  }

  set unitPrice(value: number) {
    if (value < 0) {
      throw new Error('Unit price cannot be negative');
    }
    this.props.unitPrice = value;
    this.recalculateSubtotal();
  }

  get discountPercent(): number {
    return this.props.discountPercent;
  }

  get discountValue(): number {
    return this.props.discountValue;
  }

  get subtotal(): number {
    return this.props.subtotal;
  }

  get taxIcms(): number {
    return this.props.taxIcms;
  }

  get taxIpi(): number {
    return this.props.taxIpi;
  }

  get taxPis(): number {
    return this.props.taxPis;
  }

  get taxCofins(): number {
    return this.props.taxCofins;
  }

  get taxTotal(): number {
    return this.props.taxTotal;
  }

  get ncm(): string | undefined {
    return this.props.ncm;
  }

  get cfop(): string | undefined {
    return this.props.cfop;
  }

  get quantityDelivered(): number {
    return this.props.quantityDelivered;
  }

  set quantityDelivered(value: number) {
    this.props.quantityDelivered = value;
    this.touch();
  }

  get quantityReturned(): number {
    return this.props.quantityReturned;
  }

  set quantityReturned(value: number) {
    this.props.quantityReturned = value;
    this.touch();
  }

  get priceSource(): PriceSourceType {
    return this.props.priceSource;
  }

  get priceSourceId(): string | undefined {
    return this.props.priceSourceId;
  }

  get position(): number {
    return this.props.position;
  }

  set position(value: number) {
    this.props.position = value;
    this.touch();
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  set notes(value: string | undefined) {
    this.props.notes = value;
    this.touch();
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  get quantityPending(): number {
    return this.props.quantity - this.props.quantityDelivered;
  }

  get isFullyDelivered(): boolean {
    return this.props.quantityDelivered >= this.props.quantity;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  private recalculateSubtotal(): void {
    this.props.subtotal =
      this.props.quantity * this.props.unitPrice - this.props.discountValue;
    this.touch();
  }

  static create(
    props: Optional<
      OrderItemProps,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'discountPercent'
      | 'discountValue'
      | 'subtotal'
      | 'taxIcms'
      | 'taxIpi'
      | 'taxPis'
      | 'taxCofins'
      | 'taxTotal'
      | 'quantityDelivered'
      | 'quantityReturned'
      | 'priceSource'
      | 'position'
    >,
    id?: UniqueEntityID,
  ): OrderItem {
    const discountPercent = props.discountPercent ?? 0;
    const discountValue = props.discountValue ?? 0;
    const subtotal =
      props.subtotal ?? props.quantity * props.unitPrice - discountValue;

    return new OrderItem(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        discountPercent,
        discountValue,
        subtotal,
        taxIcms: props.taxIcms ?? 0,
        taxIpi: props.taxIpi ?? 0,
        taxPis: props.taxPis ?? 0,
        taxCofins: props.taxCofins ?? 0,
        taxTotal: props.taxTotal ?? 0,
        quantityDelivered: props.quantityDelivered ?? 0,
        quantityReturned: props.quantityReturned ?? 0,
        priceSource: props.priceSource ?? 'DEFAULT',
        position: props.position ?? 0,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
      },
      id,
    );
  }
}
