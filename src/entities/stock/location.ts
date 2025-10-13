import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';
import { LocationType } from './value-objects/location-type';

export interface LocationProps {
  id: UniqueEntityID;
  code: string;
  description?: string;
  locationType?: LocationType;
  parentId?: UniqueEntityID;
  capacity?: number;
  currentOccupancy: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Location extends Entity<LocationProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get code(): string {
    return this.props.code;
  }

  set code(code: string) {
    this.props.code = code;
    this.touch();
  }

  get description(): string | undefined {
    return this.props.description;
  }

  set description(description: string | undefined) {
    this.props.description = description;
    this.touch();
  }

  get locationType(): LocationType | undefined {
    return this.props.locationType;
  }

  set locationType(type: LocationType | undefined) {
    this.props.locationType = type;
    this.touch();
  }

  get parentId(): UniqueEntityID | undefined {
    return this.props.parentId;
  }

  set parentId(parentId: UniqueEntityID | undefined) {
    this.props.parentId = parentId;
    this.touch();
  }

  get capacity(): number | undefined {
    return this.props.capacity;
  }

  set capacity(capacity: number | undefined) {
    if (capacity !== undefined && capacity < 0) {
      throw new Error('Capacity cannot be negative');
    }
    this.props.capacity = capacity;
    this.touch();
  }

  get currentOccupancy(): number {
    return this.props.currentOccupancy;
  }

  set currentOccupancy(occupancy: number) {
    if (occupancy < 0) {
      throw new Error('Occupancy cannot be negative');
    }
    this.props.currentOccupancy = occupancy;
    this.touch();
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  set isActive(isActive: boolean) {
    this.props.isActive = isActive;
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

  get hasParent(): boolean {
    return !!this.props.parentId;
  }

  get hasCapacityLimit(): boolean {
    return this.props.capacity !== undefined;
  }

  get availableCapacity(): number | null {
    if (!this.hasCapacityLimit || this.capacity === undefined) return null;
    return this.capacity - this.currentOccupancy;
  }

  get occupancyPercentage(): number {
    if (
      !this.hasCapacityLimit ||
      this.capacity === undefined ||
      this.capacity === 0
    ) {
      return 0;
    }
    return (this.currentOccupancy / this.capacity) * 100;
  }

  get isFull(): boolean {
    if (!this.hasCapacityLimit || this.capacity === undefined) return false;
    return this.currentOccupancy >= this.capacity;
  }

  get isNearCapacity(): boolean {
    return this.occupancyPercentage >= 90;
  }

  get canAcceptItems(): boolean {
    return this.isActive && !this.isFull && !this.isDeleted;
  }

  // Business Methods
  addOccupancy(amount: number): void {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    const newOccupancy = this.currentOccupancy + amount;

    if (
      this.hasCapacityLimit &&
      this.capacity !== undefined &&
      newOccupancy > this.capacity
    ) {
      throw new Error('Would exceed location capacity');
    }

    this.currentOccupancy = newOccupancy;
  }

  removeOccupancy(amount: number): void {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    if (this.currentOccupancy < amount) {
      throw new Error('Cannot remove more than current occupancy');
    }

    this.currentOccupancy -= amount;
  }

  activate(): void {
    this.isActive = true;
  }

  deactivate(): void {
    this.isActive = false;
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
      LocationProps,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'deletedAt'
      | 'currentOccupancy'
      | 'isActive'
    >,
    id?: UniqueEntityID,
  ): Location {
    const location = new Location(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        currentOccupancy: props.currentOccupancy ?? 0,
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
      },
      id,
    );

    return location;
  }
}
