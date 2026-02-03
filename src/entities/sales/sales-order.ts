import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';
import { OrderStatus } from './value-objects/order-status';

export interface SalesOrderItemProps {
  id: UniqueEntityID;
  orderId: UniqueEntityID;
  variantId: UniqueEntityID;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export class SalesOrderItem extends Entity<SalesOrderItemProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get orderId(): UniqueEntityID {
    return this.props.orderId;
  }

  get variantId(): UniqueEntityID {
    return this.props.variantId;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  set quantity(value: number) {
    if (value <= 0) {
      throw new Error('Quantity must be greater than zero');
    }
    this.props.quantity = value;
    this.recalculateTotalPrice();
  }

  get unitPrice(): number {
    return this.props.unitPrice;
  }

  set unitPrice(value: number) {
    if (value < 0) {
      throw new Error('Unit price cannot be negative');
    }
    this.props.unitPrice = value;
    this.recalculateTotalPrice();
  }

  get discount(): number {
    return this.props.discount;
  }

  set discount(value: number) {
    if (value < 0) {
      throw new Error('Discount cannot be negative');
    }
    this.props.discount = value;
    this.recalculateTotalPrice();
  }

  get totalPrice(): number {
    return this.props.totalPrice;
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

  private touch() {
    this.props.updatedAt = new Date();
  }

  private recalculateTotalPrice() {
    this.props.totalPrice =
      this.props.quantity * this.props.unitPrice - this.props.discount;
    this.touch();
  }

  static create(
    props: Optional<
      SalesOrderItemProps,
      'id' | 'totalPrice' | 'discount' | 'createdAt'
    >,
    id?: UniqueEntityID,
  ): SalesOrderItem {
    const discount = props.discount ?? 0;
    const totalPrice = props.quantity * props.unitPrice - discount;

    const item = new SalesOrderItem(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        discount,
        totalPrice,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return item;
  }
}

export interface SalesOrderProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  orderNumber: string;
  status: OrderStatus;
  customerId: UniqueEntityID;
  createdBy?: UniqueEntityID;
  totalPrice: number;
  discount: number;
  finalPrice: number;
  notes?: string;
  items: SalesOrderItem[];
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class SalesOrder extends Entity<SalesOrderProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get orderNumber(): string {
    return this.props.orderNumber;
  }

  get status(): OrderStatus {
    return this.props.status;
  }

  set status(value: OrderStatus) {
    this.props.status = value;
    this.touch();
  }

  get customerId(): UniqueEntityID {
    return this.props.customerId;
  }

  get createdBy(): UniqueEntityID | undefined {
    return this.props.createdBy;
  }

  get totalPrice(): number {
    return this.props.totalPrice;
  }

  get discount(): number {
    return this.props.discount;
  }

  set discount(value: number) {
    if (value < 0) {
      throw new Error('Discount cannot be negative');
    }
    this.props.discount = value;
    this.recalculateFinalPrice();
  }

  get finalPrice(): number {
    return this.props.finalPrice;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  set notes(value: string | undefined) {
    this.props.notes = value;
    this.touch();
  }

  get items(): SalesOrderItem[] {
    return this.props.items;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  get isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  private recalculateFinalPrice() {
    this.props.finalPrice = this.props.totalPrice - this.props.discount;
    this.touch();
  }

  private recalculateTotalPrice() {
    this.props.totalPrice = this.props.items.reduce(
      (sum, item) => sum + item.totalPrice,
      0,
    );
    this.recalculateFinalPrice();
  }

  addItem(item: SalesOrderItem) {
    if (!this.status.canBeModified) {
      throw new Error('Cannot modify order in current status');
    }
    this.props.items.push(item);
    this.recalculateTotalPrice();
  }

  removeItem(itemId: UniqueEntityID) {
    if (!this.status.canBeModified) {
      throw new Error('Cannot modify order in current status');
    }
    this.props.items = this.props.items.filter(
      (item) => !item.id.equals(itemId),
    );
    this.recalculateTotalPrice();
  }

  confirm() {
    if (!this.status.isPending) {
      throw new Error('Only pending orders can be confirmed');
    }
    this.props.status = OrderStatus.CONFIRMED();
    this.touch();
  }

  cancel() {
    if (this.status.isFinal) {
      throw new Error('Cannot cancel order in final status');
    }
    this.props.status = OrderStatus.CANCELLED();
    this.touch();
  }

  delete() {
    this.props.deletedAt = new Date();
    this.touch();
  }

  restore() {
    this.props.deletedAt = undefined;
    this.touch();
  }

  static create(
    props: Optional<
      SalesOrderProps,
      'id' | 'totalPrice' | 'discount' | 'finalPrice' | 'items' | 'createdAt'
    >,
    id?: UniqueEntityID,
  ): SalesOrder {
    const items = props.items ?? [];
    const totalPrice = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const discount = props.discount ?? 0;
    const finalPrice = totalPrice - discount;

    const order = new SalesOrder(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        items,
        totalPrice,
        discount,
        finalPrice,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return order;
  }
}
