export type LocationTypeValue =
  | 'WAREHOUSE'
  | 'ZONE'
  | 'AISLE'
  | 'SHELF'
  | 'BIN'
  | 'OTHER';

export class LocationType {
  private readonly type: LocationTypeValue;

  private constructor(type: LocationTypeValue) {
    this.type = type;
  }

  static create(type: LocationTypeValue): LocationType {
    return new LocationType(type);
  }

  get value(): LocationTypeValue {
    return this.type;
  }

  // Type Checkers
  get isWarehouse(): boolean {
    return this.type === 'WAREHOUSE';
  }

  get isZone(): boolean {
    return this.type === 'ZONE';
  }

  get isAisle(): boolean {
    return this.type === 'AISLE';
  }

  get isShelf(): boolean {
    return this.type === 'SHELF';
  }

  get isBin(): boolean {
    return this.type === 'BIN';
  }

  get isOther(): boolean {
    return this.type === 'OTHER';
  }

  // Business Logic - Hierarquia de localizações
  get canHaveChildren(): boolean {
    return (
      this.type === 'WAREHOUSE' ||
      this.type === 'ZONE' ||
      this.type === 'AISLE' ||
      this.type === 'SHELF'
    );
  }

  get isLeafNode(): boolean {
    return this.type === 'BIN';
  }

  equals(other: LocationType): boolean {
    return this.type === other.type;
  }
}
