import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';
import { ItemStatus } from './value-objects/item-status';

export interface ItemProps {
  id: UniqueEntityID;
  uniqueCode: string;
  variantId: UniqueEntityID;
  locationId: UniqueEntityID;
  initialQuantity: number;
  currentQuantity: number;
  status: ItemStatus;
  entryDate: Date;
  attributes: Record<string, unknown>;
  batchNumber?: string;
  manufacturingDate?: Date;
  expiryDate?: Date;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Item extends Entity<ItemProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get uniqueCode(): string {
    return this.props.uniqueCode;
  }

  get variantId(): UniqueEntityID {
    return this.props.variantId;
  }

  get locationId(): UniqueEntityID {
    return this.props.locationId;
  }

  set locationId(locationId: UniqueEntityID) {
    this.props.locationId = locationId;
    this.touch();
  }

  get initialQuantity(): number {
    return this.props.initialQuantity;
  }

  get currentQuantity(): number {
    return this.props.currentQuantity;
  }

  set currentQuantity(quantity: number) {
    if (quantity < 0) {
      throw new Error('Quantity cannot be negative');
    }
    this.props.currentQuantity = quantity;
    this.touch();
  }

  get status(): ItemStatus {
    return this.props.status;
  }

  set status(status: ItemStatus) {
    this.props.status = status;
    this.touch();
  }

  get entryDate(): Date {
    return this.props.entryDate;
  }

  get attributes(): Record<string, unknown> {
    return this.props.attributes;
  }

  set attributes(attributes: Record<string, unknown>) {
    this.props.attributes = attributes;
    this.touch();
  }

  get batchNumber(): string | undefined {
    return this.props.batchNumber;
  }

  set batchNumber(batchNumber: string | undefined) {
    this.props.batchNumber = batchNumber;
    this.touch();
  }

  get manufacturingDate(): Date | undefined {
    return this.props.manufacturingDate;
  }

  set manufacturingDate(date: Date | undefined) {
    this.props.manufacturingDate = date;
    this.touch();
  }

  get expiryDate(): Date | undefined {
    return this.props.expiryDate;
  }

  set expiryDate(date: Date | undefined) {
    this.props.expiryDate = date;
    this.touch();
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

  // Computed Properties
  get isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  get quantityUsed(): number {
    return this.props.initialQuantity - this.props.currentQuantity;
  }

  get utilizationPercentage(): number {
    if (this.props.initialQuantity === 0) return 0;
    return (this.quantityUsed / this.props.initialQuantity) * 100;
  }

  get isExpired(): boolean {
    if (!this.props.expiryDate) return false;
    return new Date() > this.props.expiryDate;
  }

  get isExpiringSoon(): boolean {
    if (!this.props.expiryDate) return false;
    const daysUntilExpiry = this.daysUntilExpiry;
    return daysUntilExpiry !== null && daysUntilExpiry <= 30;
  }

  get daysUntilExpiry(): number | null {
    if (!this.props.expiryDate) return null;
    const now = new Date();
    const diffTime = this.props.expiryDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get isEmpty(): boolean {
    return this.props.currentQuantity === 0;
  }

  get canBeSold(): boolean {
    return (
      this.props.status.canBeSold &&
      !this.isEmpty &&
      !this.isExpired &&
      !this.isDeleted
    );
  }

  get canBeReserved(): boolean {
    return (
      this.props.status.canBeReserved &&
      !this.isEmpty &&
      !this.isExpired &&
      !this.isDeleted
    );
  }

  // Business Methods
  addQuantity(amount: number): void {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }
    this.currentQuantity += amount;
  }

  removeQuantity(amount: number): void {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }
    if (this.currentQuantity < amount) {
      throw new Error('Insufficient quantity');
    }
    this.currentQuantity -= amount;
  }

  reserve(): void {
    this.status = ItemStatus.create('RESERVED');
  }

  makeAvailable(): void {
    this.status = ItemStatus.create('AVAILABLE');
  }

  markAsDamaged(): void {
    this.status = ItemStatus.create('DAMAGED');
  }

  markAsExpired(): void {
    this.status = ItemStatus.create('EXPIRED');
  }

  dispose(): void {
    this.status = ItemStatus.create('DISPOSED');
  }

  delete(): void {
    this.props.deletedAt = new Date();
    this.touch();
  }

  restore(): void {
    this.props.deletedAt = undefined;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<ItemProps, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
    id?: UniqueEntityID,
  ): Item {
    const item = new Item(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
      },
      id,
    );

    return item;
  }
}
