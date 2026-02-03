import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';
import { OrderStatus } from '../sales/value-objects/order-status';

export interface PurchaseOrderItemProps {
  id: UniqueEntityID;
  orderId: UniqueEntityID;
  variantId: UniqueEntityID;
  quantity: number;
  unitCost: number;
  totalCost: number;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export class PurchaseOrderItem extends Entity<PurchaseOrderItemProps> {
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
    this.recalculateTotalCost();
  }

  get unitCost(): number {
    return this.props.unitCost;
  }

  set unitCost(value: number) {
    if (value < 0) {
      throw new Error('Unit cost cannot be negative');
    }
    this.props.unitCost = value;
    this.recalculateTotalCost();
  }

  get totalCost(): number {
    return this.props.totalCost;
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

  private recalculateTotalCost() {
    this.props.totalCost = this.props.quantity * this.props.unitCost;
    this.touch();
  }

  static create(
    props: Optional<PurchaseOrderItemProps, 'id' | 'totalCost' | 'createdAt'>,
    id?: UniqueEntityID,
  ): PurchaseOrderItem {
    const totalCost = props.quantity * props.unitCost;

    const item = new PurchaseOrderItem(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        totalCost,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return item;
  }
}

export interface PurchaseOrderProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  orderNumber: string;
  status: OrderStatus;
  supplierId: UniqueEntityID;
  createdBy?: UniqueEntityID;
  totalCost: number;
  expectedDate?: Date;
  receivedDate?: Date;
  notes?: string;
  items: PurchaseOrderItem[];
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class PurchaseOrder extends Entity<PurchaseOrderProps> {
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

  get supplierId(): UniqueEntityID {
    return this.props.supplierId;
  }

  get createdBy(): UniqueEntityID | undefined {
    return this.props.createdBy;
  }

  get totalCost(): number {
    return this.props.totalCost;
  }

  get expectedDate(): Date | undefined {
    return this.props.expectedDate;
  }

  set expectedDate(value: Date | undefined) {
    this.props.expectedDate = value;
    this.touch();
  }

  get receivedDate(): Date | undefined {
    return this.props.receivedDate;
  }

  set receivedDate(value: Date | undefined) {
    this.props.receivedDate = value;
    this.touch();
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  set notes(value: string | undefined) {
    this.props.notes = value;
    this.touch();
  }

  get items(): PurchaseOrderItem[] {
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

  private recalculateTotalCost() {
    this.props.totalCost = this.props.items.reduce(
      (sum, item) => sum + item.totalCost,
      0,
    );
    this.touch();
  }

  addItem(item: PurchaseOrderItem) {
    if (!this.status.canBeModified) {
      throw new Error('Cannot modify order in current status');
    }
    this.props.items.push(item);
    this.recalculateTotalCost();
  }

  removeItem(itemId: UniqueEntityID) {
    if (!this.status.canBeModified) {
      throw new Error('Cannot modify order in current status');
    }
    this.props.items = this.props.items.filter(
      (item) => !item.id.equals(itemId),
    );
    this.recalculateTotalCost();
  }

  confirm() {
    if (!this.status.isPending) {
      throw new Error('Only pending orders can be confirmed');
    }
    this.props.status = OrderStatus.CONFIRMED();
    this.touch();
  }

  receive() {
    if (!this.status.isConfirmed) {
      throw new Error('Only confirmed orders can be received');
    }
    this.props.status = OrderStatus.DELIVERED();
    this.props.receivedDate = new Date();
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
      PurchaseOrderProps,
      'id' | 'totalCost' | 'items' | 'createdAt'
    >,
    id?: UniqueEntityID,
  ): PurchaseOrder {
    const items = props.items ?? [];
    const totalCost = items.reduce((sum, item) => sum + item.totalCost, 0);

    const order = new PurchaseOrder(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        items,
        totalCost,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return order;
  }
}
