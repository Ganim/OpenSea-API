export type ProductStatusValue =
  | 'DRAFT'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'DISCONTINUED'
  | 'OUT_OF_STOCK';

export class ProductStatus {
  private readonly status: ProductStatusValue;

  private constructor(status: ProductStatusValue) {
    this.status = status;
  }

  static create(status: ProductStatusValue): ProductStatus {
    return new ProductStatus(status);
  }

  get value(): ProductStatusValue {
    return this.status;
  }

  // Status Checkers
  get isDraft(): boolean {
    return this.status === 'DRAFT';
  }

  get isActive(): boolean {
    return this.status === 'ACTIVE';
  }

  get isInactive(): boolean {
    return this.status === 'INACTIVE';
  }

  get isDiscontinued(): boolean {
    return this.status === 'DISCONTINUED';
  }

  get isOutOfStock(): boolean {
    return this.status === 'OUT_OF_STOCK';
  }

  // Business Logic
  get canBeSold(): boolean {
    return this.status === 'ACTIVE';
  }

  get canBePublished(): boolean {
    return this.status === 'ACTIVE' && !this.isOutOfStock;
  }

  get requiresAttention(): boolean {
    return this.status === 'OUT_OF_STOCK' || this.status === 'DISCONTINUED';
  }

  get isVisible(): boolean {
    return this.status === 'ACTIVE' || this.status === 'OUT_OF_STOCK';
  }

  equals(other: ProductStatus): boolean {
    return this.status === other.status;
  }
}
