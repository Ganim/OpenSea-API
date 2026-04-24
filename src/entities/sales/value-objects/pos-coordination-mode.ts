export type PosCoordinationModeValue =
  | 'STANDALONE'
  | 'SELLER'
  | 'CASHIER'
  | 'BOTH';

export class PosCoordinationMode {
  private readonly _value: PosCoordinationModeValue;

  private constructor(value: PosCoordinationModeValue) {
    this._value = value;
  }

  static create(value: string): PosCoordinationMode {
    const normalized = value.toUpperCase() as PosCoordinationModeValue;

    const validModes: PosCoordinationModeValue[] = [
      'STANDALONE',
      'SELLER',
      'CASHIER',
      'BOTH',
    ];

    if (!validModes.includes(normalized)) {
      throw new Error(`Invalid PosCoordinationMode: ${value}`);
    }

    return new PosCoordinationMode(normalized);
  }

  static STANDALONE(): PosCoordinationMode {
    return new PosCoordinationMode('STANDALONE');
  }

  static SELLER(): PosCoordinationMode {
    return new PosCoordinationMode('SELLER');
  }

  static CASHIER(): PosCoordinationMode {
    return new PosCoordinationMode('CASHIER');
  }

  static BOTH(): PosCoordinationMode {
    return new PosCoordinationMode('BOTH');
  }

  get value(): PosCoordinationModeValue {
    return this._value;
  }

  get isStandalone(): boolean {
    return this._value === 'STANDALONE';
  }

  get isSeller(): boolean {
    return this._value === 'SELLER';
  }

  get isCashier(): boolean {
    return this._value === 'CASHIER';
  }

  get isBoth(): boolean {
    return this._value === 'BOTH';
  }

  toString(): string {
    return this._value;
  }

  equals(other: PosCoordinationMode): boolean {
    return this._value === other._value;
  }
}
