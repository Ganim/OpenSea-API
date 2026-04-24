export type PosOperatorSessionModeValue = 'PER_SALE' | 'STAY_LOGGED_IN';

export class PosOperatorSessionMode {
  private readonly _value: PosOperatorSessionModeValue;

  private constructor(value: PosOperatorSessionModeValue) {
    this._value = value;
  }

  static create(value: string): PosOperatorSessionMode {
    const normalized = value.toUpperCase() as PosOperatorSessionModeValue;

    const validModes: PosOperatorSessionModeValue[] = [
      'PER_SALE',
      'STAY_LOGGED_IN',
    ];

    if (!validModes.includes(normalized)) {
      throw new Error(`Invalid PosOperatorSessionMode: ${value}`);
    }

    return new PosOperatorSessionMode(normalized);
  }

  static PER_SALE(): PosOperatorSessionMode {
    return new PosOperatorSessionMode('PER_SALE');
  }

  static STAY_LOGGED_IN(): PosOperatorSessionMode {
    return new PosOperatorSessionMode('STAY_LOGGED_IN');
  }

  get value(): PosOperatorSessionModeValue {
    return this._value;
  }

  get isPerSale(): boolean {
    return this._value === 'PER_SALE';
  }

  get isStayLoggedIn(): boolean {
    return this._value === 'STAY_LOGGED_IN';
  }

  toString(): string {
    return this._value;
  }

  equals(other: PosOperatorSessionMode): boolean {
    return this._value === other._value;
  }
}
