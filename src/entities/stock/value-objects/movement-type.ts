export type MovementTypeValue =
  | 'PURCHASE'
  | 'CUSTOMER_RETURN'
  | 'SALE'
  | 'PRODUCTION'
  | 'SAMPLE'
  | 'LOSS'
  | 'SUPPLIER_RETURN'
  | 'TRANSFER'
  | 'INVENTORY_ADJUSTMENT'
  | 'ZONE_RECONFIGURE';

export class MovementType {
  private readonly type: MovementTypeValue;

  private constructor(type: MovementTypeValue) {
    this.type = type;
  }

  static create(type: MovementTypeValue): MovementType {
    return new MovementType(type);
  }

  get value(): MovementTypeValue {
    return this.type;
  }

  // Type Checkers
  get isPurchase(): boolean {
    return this.type === 'PURCHASE';
  }

  get isCustomerReturn(): boolean {
    return this.type === 'CUSTOMER_RETURN';
  }

  get isSale(): boolean {
    return this.type === 'SALE';
  }

  get isProduction(): boolean {
    return this.type === 'PRODUCTION';
  }

  get isSample(): boolean {
    return this.type === 'SAMPLE';
  }

  get isLoss(): boolean {
    return this.type === 'LOSS';
  }

  get isSupplierReturn(): boolean {
    return this.type === 'SUPPLIER_RETURN';
  }

  get isTransfer(): boolean {
    return this.type === 'TRANSFER';
  }

  get isInventoryAdjustment(): boolean {
    return this.type === 'INVENTORY_ADJUSTMENT';
  }

  get isZoneReconfigure(): boolean {
    return this.type === 'ZONE_RECONFIGURE';
  }

  // Business Logic
  get reducesStock(): boolean {
    return (
      this.type === 'SALE' ||
      this.type === 'PRODUCTION' ||
      this.type === 'SAMPLE' ||
      this.type === 'LOSS' ||
      this.type === 'SUPPLIER_RETURN'
    );
  }

  get increasesStock(): boolean {
    return this.type === 'PURCHASE' || this.type === 'CUSTOMER_RETURN';
  }

  get requiresApproval(): boolean {
    return this.type === 'LOSS' || this.type === 'INVENTORY_ADJUSTMENT';
  }

  equals(other: MovementType): boolean {
    return this.type === other.type;
  }
}
