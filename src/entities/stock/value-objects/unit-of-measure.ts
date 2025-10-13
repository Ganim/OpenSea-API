export type UnitOfMeasureValue = 'METERS' | 'KILOGRAMS' | 'UNITS';

export class UnitOfMeasure {
  private readonly unit: UnitOfMeasureValue;

  private constructor(unit: UnitOfMeasureValue) {
    this.unit = unit;
  }

  static create(unit: UnitOfMeasureValue): UnitOfMeasure {
    return new UnitOfMeasure(unit);
  }

  get value(): UnitOfMeasureValue {
    return this.unit;
  }

  // Unit Checkers
  get isMeters(): boolean {
    return this.unit === 'METERS';
  }

  get isKilograms(): boolean {
    return this.unit === 'KILOGRAMS';
  }

  get isUnits(): boolean {
    return this.unit === 'UNITS';
  }

  // Business Logic
  get symbol(): string {
    switch (this.unit) {
      case 'METERS':
        return 'm';
      case 'KILOGRAMS':
        return 'kg';
      case 'UNITS':
        return 'un';
    }
  }

  get fullName(): string {
    switch (this.unit) {
      case 'METERS':
        return 'Metros';
      case 'KILOGRAMS':
        return 'Quilogramas';
      case 'UNITS':
        return 'Unidades';
    }
  }

  get isWeightBased(): boolean {
    return this.unit === 'KILOGRAMS';
  }

  get isLengthBased(): boolean {
    return this.unit === 'METERS';
  }

  get isCountable(): boolean {
    return this.unit === 'UNITS';
  }

  equals(other: UnitOfMeasure): boolean {
    return this.unit === other.unit;
  }
}
