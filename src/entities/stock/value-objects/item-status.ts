export type ItemStatusValue =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'IN_TRANSIT'
  | 'DAMAGED'
  | 'EXPIRED'
  | 'DISPOSED';

export class ItemStatus {
  private readonly status: ItemStatusValue;

  private constructor(status: ItemStatusValue) {
    this.status = status;
  }

  static create(status: ItemStatusValue): ItemStatus {
    return new ItemStatus(status);
  }

  get value(): ItemStatusValue {
    return this.status;
  }

  // Status Checkers
  get isAvailable(): boolean {
    return this.status === 'AVAILABLE';
  }

  get isReserved(): boolean {
    return this.status === 'RESERVED';
  }

  get isInTransit(): boolean {
    return this.status === 'IN_TRANSIT';
  }

  get isDamaged(): boolean {
    return this.status === 'DAMAGED';
  }

  get isExpired(): boolean {
    return this.status === 'EXPIRED';
  }

  get isDisposed(): boolean {
    return this.status === 'DISPOSED';
  }

  // Business Logic
  get canBeSold(): boolean {
    return this.status === 'AVAILABLE';
  }

  get canBeReserved(): boolean {
    return this.status === 'AVAILABLE';
  }

  get requiresAction(): boolean {
    return this.status === 'DAMAGED' || this.status === 'EXPIRED';
  }

  equals(other: ItemStatus): boolean {
    return this.status === other.status;
  }
}
