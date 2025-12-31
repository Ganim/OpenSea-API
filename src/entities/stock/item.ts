import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';
import { ItemStatus } from './value-objects/item-status';

export interface ItemProps {
  id: UniqueEntityID;
  uniqueCode?: string; // Código único manual opcional
  fullCode?: string; // Código completo gerado automaticamente (ex: 23.6.23-1)
  sequentialCode?: number; // Código sequencial do item dentro da variante
  variantId: UniqueEntityID;
  locationId?: UniqueEntityID; // Agora opcional
  initialQuantity: number;
  currentQuantity: number;
  unitCost?: number; // Custo unitário do item
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

  get uniqueCode(): string | undefined {
    return this.props.uniqueCode;
  }

  set uniqueCode(uniqueCode: string | undefined) {
    this.props.uniqueCode = uniqueCode;
    this.touch();
  }

  get fullCode(): string | undefined {
    return this.props.fullCode;
  }

  set fullCode(fullCode: string | undefined) {
    this.props.fullCode = fullCode;
    this.touch();
  }

  get sequentialCode(): number | undefined {
    return this.props.sequentialCode;
  }

  get variantId(): UniqueEntityID {
    return this.props.variantId;
  }

  get locationId(): UniqueEntityID | undefined {
    return this.props.locationId;
  }

  set locationId(locationId: UniqueEntityID | undefined) {
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

  get unitCost(): number | undefined {
    return this.props.unitCost;
  }

  set unitCost(unitCost: number | undefined) {
    if (unitCost !== undefined && unitCost < 0) {
      throw new Error('Unit cost cannot be negative');
    }
    this.props.unitCost = unitCost;
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

  get hasLocation(): boolean {
    return !!this.props.locationId;
  }

  get hasUnitCost(): boolean {
    return this.props.unitCost !== undefined;
  }

  get totalCost(): number | undefined {
    if (this.props.unitCost === undefined) return undefined;
    return this.props.unitCost * this.props.currentQuantity;
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

  get displayCode(): string {
    return (
      this.props.fullCode ?? this.props.uniqueCode ?? this.props.id.toString()
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
    props: Optional<
      ItemProps,
      'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'attributes' | 'status'
    >,
    id?: UniqueEntityID,
  ): Item {
    const item = new Item(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        attributes: props.attributes ?? {},
        status: props.status ?? ItemStatus.create('AVAILABLE'),
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
      },
      id,
    );

    return item;
  }
}
