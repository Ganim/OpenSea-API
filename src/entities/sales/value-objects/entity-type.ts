export type EntityTypeValue =
  | 'PRODUCT'
  | 'VARIANT'
  | 'ITEM'
  | 'CUSTOMER'
  | 'SUPPLIER'
  | 'MANUFACTURER'
  | 'SALES_ORDER'
  | 'PURCHASE_ORDER'
  | 'OTHER';

export class EntityType {
  private readonly _value: EntityTypeValue;

  private constructor(value: EntityTypeValue) {
    this._value = value;
  }

  static create(value: string): EntityType {
    const normalized = value.toUpperCase() as EntityTypeValue;

    const validTypes: EntityTypeValue[] = [
      'PRODUCT',
      'VARIANT',
      'ITEM',
      'CUSTOMER',
      'SUPPLIER',
      'MANUFACTURER',
      'SALES_ORDER',
      'PURCHASE_ORDER',
      'OTHER',
    ];

    if (!validTypes.includes(normalized)) {
      throw new Error(`Invalid EntityType: ${value}`);
    }

    return new EntityType(normalized);
  }

  static PRODUCT(): EntityType {
    return new EntityType('PRODUCT');
  }

  static VARIANT(): EntityType {
    return new EntityType('VARIANT');
  }

  static ITEM(): EntityType {
    return new EntityType('ITEM');
  }

  static CUSTOMER(): EntityType {
    return new EntityType('CUSTOMER');
  }

  static SUPPLIER(): EntityType {
    return new EntityType('SUPPLIER');
  }

  static MANUFACTURER(): EntityType {
    return new EntityType('MANUFACTURER');
  }

  static SALES_ORDER(): EntityType {
    return new EntityType('SALES_ORDER');
  }

  static PURCHASE_ORDER(): EntityType {
    return new EntityType('PURCHASE_ORDER');
  }

  static OTHER(): EntityType {
    return new EntityType('OTHER');
  }

  get value(): EntityTypeValue {
    return this._value;
  }

  toString(): string {
    return this._value;
  }

  equals(other: EntityType): boolean {
    return this._value === other._value;
  }
}
