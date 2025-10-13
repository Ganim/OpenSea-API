export type MovementTypeValue =
  | 'SALE'
  | 'PRODUCTION'
  | 'SAMPLE'
  | 'LOSS'
  | 'TRANSFER'
  | 'INVENTORY_ADJUSTMENT';

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

  get isTransfer(): boolean {
    return this.type === 'TRANSFER';
  }

  get isInventoryAdjustment(): boolean {
    return this.type === 'INVENTORY_ADJUSTMENT';
  }

  // Business Logic
  get reducesStock(): boolean {
    return (
      this.type === 'SALE' ||
      this.type === 'SAMPLE' ||
      this.type === 'LOSS' ||
      this.type === 'TRANSFER'
    );
  }

  get increasesStock(): boolean {
    return this.type === 'PRODUCTION';
  }

  get requiresApproval(): boolean {
    return this.type === 'LOSS' || this.type === 'INVENTORY_ADJUSTMENT';
  }

  equals(other: MovementType): boolean {
    return this.type === other.type;
  }
}
