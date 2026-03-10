export type UnitOfMeasureValue =
  | 'UNITS'
  | 'METERS'
  | 'KILOGRAMS'
  | 'GRAMS'
  | 'LITERS'
  | 'MILLILITERS'
  | 'SQUARE_METERS'
  | 'PAIRS'
  | 'BOXES'
  | 'PACKS';

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
      case 'GRAMS':
        return 'g';
      case 'LITERS':
        return 'L';
      case 'MILLILITERS':
        return 'mL';
      case 'SQUARE_METERS':
        return 'm²';
      case 'PAIRS':
        return 'par';
      case 'BOXES':
        return 'cx';
      case 'PACKS':
        return 'pct';
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
      case 'GRAMS':
        return 'Gramas';
      case 'LITERS':
        return 'Litros';
      case 'MILLILITERS':
        return 'Mililitros';
      case 'SQUARE_METERS':
        return 'Metros Quadrados';
      case 'PAIRS':
        return 'Pares';
      case 'BOXES':
        return 'Caixas';
      case 'PACKS':
        return 'Pacotes';
      case 'UNITS':
        return 'Unidades';
    }
  }

  get isWeightBased(): boolean {
    return this.unit === 'KILOGRAMS' || this.unit === 'GRAMS';
  }

  get isLengthBased(): boolean {
    return this.unit === 'METERS';
  }

  get isVolumeBased(): boolean {
    return this.unit === 'LITERS' || this.unit === 'MILLILITERS';
  }

  get isAreaBased(): boolean {
    return this.unit === 'SQUARE_METERS';
  }

  get isCountable(): boolean {
    return (
      this.unit === 'UNITS' ||
      this.unit === 'PAIRS' ||
      this.unit === 'BOXES' ||
      this.unit === 'PACKS'
    );
  }

  equals(other: UnitOfMeasure): boolean {
    return this.unit === other.unit;
  }
}
