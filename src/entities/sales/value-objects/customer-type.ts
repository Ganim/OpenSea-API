export class CustomerType {
  private readonly _value: 'INDIVIDUAL' | 'BUSINESS';

  private constructor(value: 'INDIVIDUAL' | 'BUSINESS') {
    this._value = value;
  }

  static create(value: string): CustomerType {
    const normalized = value.toUpperCase();

    if (normalized !== 'INDIVIDUAL' && normalized !== 'BUSINESS') {
      throw new Error('CustomerType must be either INDIVIDUAL or BUSINESS');
    }

    return new CustomerType(normalized as 'INDIVIDUAL' | 'BUSINESS');
  }

  static INDIVIDUAL(): CustomerType {
    return new CustomerType('INDIVIDUAL');
  }

  static BUSINESS(): CustomerType {
    return new CustomerType('BUSINESS');
  }

  get value(): 'INDIVIDUAL' | 'BUSINESS' {
    return this._value;
  }

  get isIndividual(): boolean {
    return this._value === 'INDIVIDUAL';
  }

  get isBusiness(): boolean {
    return this._value === 'BUSINESS';
  }

  toString(): string {
    return this._value;
  }

  equals(other: CustomerType): boolean {
    return this._value === other._value;
  }
}
