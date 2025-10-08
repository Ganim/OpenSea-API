export type OrderStatusType =
  | 'DRAFT'
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED';

export class OrderStatus {
  private readonly _value: OrderStatusType;

  private constructor(value: OrderStatusType) {
    this._value = value;
  }

  static create(value: string): OrderStatus {
    const normalized = value.toUpperCase() as OrderStatusType;

    const validStatuses: OrderStatusType[] = [
      'DRAFT',
      'PENDING',
      'CONFIRMED',
      'IN_TRANSIT',
      'DELIVERED',
      'CANCELLED',
      'RETURNED',
    ];

    if (!validStatuses.includes(normalized)) {
      throw new Error(`Invalid OrderStatus: ${value}`);
    }

    return new OrderStatus(normalized);
  }

  static DRAFT(): OrderStatus {
    return new OrderStatus('DRAFT');
  }

  static PENDING(): OrderStatus {
    return new OrderStatus('PENDING');
  }

  static CONFIRMED(): OrderStatus {
    return new OrderStatus('CONFIRMED');
  }

  static IN_TRANSIT(): OrderStatus {
    return new OrderStatus('IN_TRANSIT');
  }

  static DELIVERED(): OrderStatus {
    return new OrderStatus('DELIVERED');
  }

  static CANCELLED(): OrderStatus {
    return new OrderStatus('CANCELLED');
  }

  static RETURNED(): OrderStatus {
    return new OrderStatus('RETURNED');
  }

  get value(): OrderStatusType {
    return this._value;
  }

  get isDraft(): boolean {
    return this._value === 'DRAFT';
  }

  get isPending(): boolean {
    return this._value === 'PENDING';
  }

  get isConfirmed(): boolean {
    return this._value === 'CONFIRMED';
  }

  get isInTransit(): boolean {
    return this._value === 'IN_TRANSIT';
  }

  get isDelivered(): boolean {
    return this._value === 'DELIVERED';
  }

  get isCancelled(): boolean {
    return this._value === 'CANCELLED';
  }

  get isReturned(): boolean {
    return this._value === 'RETURNED';
  }

  get canBeModified(): boolean {
    return this._value === 'DRAFT' || this._value === 'PENDING';
  }

  get isFinal(): boolean {
    return (
      this._value === 'DELIVERED' ||
      this._value === 'CANCELLED' ||
      this._value === 'RETURNED'
    );
  }

  toString(): string {
    return this._value;
  }

  equals(other: OrderStatus): boolean {
    return this._value === other._value;
  }
}
