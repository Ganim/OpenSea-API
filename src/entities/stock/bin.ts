import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface BinProps {
  id: UniqueEntityID;
  zoneId: UniqueEntityID;
  address: string;
  aisle: number;
  shelf: number;
  position: string;
  capacity: number | null;
  currentOccupancy: number;
  isActive: boolean;
  isBlocked: boolean;
  blockReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class Bin extends Entity<BinProps> {
  // Getters
  get binId(): UniqueEntityID {
    return this.props.id;
  }

  get zoneId(): UniqueEntityID {
    return this.props.zoneId;
  }

  get address(): string {
    return this.props.address;
  }

  get aisle(): number {
    return this.props.aisle;
  }

  get shelf(): number {
    return this.props.shelf;
  }

  get position(): string {
    return this.props.position;
  }

  get capacity(): number | null {
    return this.props.capacity;
  }

  get currentOccupancy(): number {
    return this.props.currentOccupancy;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get isBlocked(): boolean {
    return this.props.isBlocked;
  }

  get blockReason(): string | null {
    return this.props.blockReason;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  // Setters
  set capacity(capacity: number | null) {
    if (capacity !== null && capacity < 0) {
      throw new Error('Capacity cannot be negative');
    }
    this.props.capacity = capacity;
    this.touch();
  }

  set currentOccupancy(currentOccupancy: number) {
    if (currentOccupancy < 0) {
      throw new Error('Current occupancy cannot be negative');
    }
    this.props.currentOccupancy = currentOccupancy;
    this.touch();
  }

  set isActive(isActive: boolean) {
    this.props.isActive = isActive;
    this.touch();
  }

  set isBlocked(isBlocked: boolean) {
    this.props.isBlocked = isBlocked;
    if (!isBlocked) {
      this.props.blockReason = null;
    }
    this.touch();
  }

  set blockReason(blockReason: string | null) {
    this.props.blockReason = blockReason;
    this.touch();
  }

  set deletedAt(deletedAt: Date | null) {
    this.props.deletedAt = deletedAt;
    this.touch();
  }

  // Computed Properties
  get hasCapacityLimit(): boolean {
    return this.capacity !== null;
  }

  get occupancyPercentage(): number {
    if (!this.hasCapacityLimit || this.capacity === 0) return 0;
    return Math.round((this.currentOccupancy / this.capacity!) * 100);
  }

  get isFull(): boolean {
    if (!this.hasCapacityLimit) return false;
    return this.currentOccupancy >= this.capacity!;
  }

  get isEmpty(): boolean {
    return this.currentOccupancy === 0;
  }

  get availableSpace(): number | null {
    if (!this.hasCapacityLimit) return null;
    return Math.max(0, this.capacity! - this.currentOccupancy);
  }

  get isAvailable(): boolean {
    return this.isActive && !this.isBlocked && !this.isFull;
  }

  // Business Methods
  activate(): void {
    this.isActive = true;
  }

  deactivate(): void {
    this.isActive = false;
  }

  block(reason: string): void {
    this.isBlocked = true;
    this.blockReason = reason;
  }

  unblock(): void {
    this.isBlocked = false;
    this.blockReason = null;
  }

  addOccupancy(amount: number): void {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }
    if (
      this.hasCapacityLimit &&
      this.currentOccupancy + amount > this.capacity!
    ) {
      throw new Error('Would exceed bin capacity');
    }
    this.currentOccupancy = this.currentOccupancy + amount;
  }

  removeOccupancy(amount: number): void {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }
    if (this.currentOccupancy - amount < 0) {
      throw new Error('Cannot remove more than current occupancy');
    }
    this.currentOccupancy = this.currentOccupancy - amount;
  }

  setCapacity(capacity: number | null): void {
    if (capacity !== null && this.currentOccupancy > capacity) {
      throw new Error('Cannot set capacity below current occupancy');
    }
    this.capacity = capacity;
  }

  delete(): void {
    this.deletedAt = new Date();
  }

  restore(): void {
    this.deletedAt = null;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      BinProps,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'deletedAt'
      | 'isActive'
      | 'isBlocked'
      | 'blockReason'
      | 'currentOccupancy'
    >,
    id?: UniqueEntityID,
  ): Bin {
    const binId = id ?? props.id ?? new UniqueEntityID();

    const bin = new Bin(
      {
        ...props,
        id: binId,
        currentOccupancy: props.currentOccupancy ?? 0,
        isActive: props.isActive ?? true,
        isBlocked: props.isBlocked ?? false,
        blockReason: props.blockReason ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
        deletedAt: props.deletedAt ?? null,
      },
      binId,
    );

    return bin;
  }
}
