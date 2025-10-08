export type DiscountTypeValue = 'PERCENTAGE' | 'FIXED_AMOUNT';

export class DiscountType {
  private readonly _value: DiscountTypeValue;

  private constructor(value: DiscountTypeValue) {
    this._value = value;
  }

  static create(value: string): DiscountType {
    const normalized = value.toUpperCase() as DiscountTypeValue;

    if (normalized !== 'PERCENTAGE' && normalized !== 'FIXED_AMOUNT') {
      throw new Error('DiscountType must be either PERCENTAGE or FIXED_AMOUNT');
    }

    return new DiscountType(normalized);
  }

  static PERCENTAGE(): DiscountType {
    return new DiscountType('PERCENTAGE');
  }

  static FIXED_AMOUNT(): DiscountType {
    return new DiscountType('FIXED_AMOUNT');
  }

  get value(): DiscountTypeValue {
    return this._value;
  }

  get isPercentage(): boolean {
    return this._value === 'PERCENTAGE';
  }

  get isFixedAmount(): boolean {
    return this._value === 'FIXED_AMOUNT';
  }

  toString(): string {
    return this._value;
  }

  equals(other: DiscountType): boolean {
    return this._value === other._value;
  }
}
