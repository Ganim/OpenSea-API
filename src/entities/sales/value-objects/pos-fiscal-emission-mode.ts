export type PosFiscalEmissionModeValue =
  | 'ONLINE_SYNC'
  | 'OFFLINE_CONTINGENCY'
  | 'NONE';

export class PosFiscalEmissionMode {
  private readonly _value: PosFiscalEmissionModeValue;

  private constructor(value: PosFiscalEmissionModeValue) {
    this._value = value;
  }

  static create(value: string): PosFiscalEmissionMode {
    const normalized = value.toUpperCase() as PosFiscalEmissionModeValue;

    const validModes: PosFiscalEmissionModeValue[] = [
      'ONLINE_SYNC',
      'OFFLINE_CONTINGENCY',
      'NONE',
    ];

    if (!validModes.includes(normalized)) {
      throw new Error(`Invalid PosFiscalEmissionMode: ${value}`);
    }

    return new PosFiscalEmissionMode(normalized);
  }

  static ONLINE_SYNC(): PosFiscalEmissionMode {
    return new PosFiscalEmissionMode('ONLINE_SYNC');
  }

  static OFFLINE_CONTINGENCY(): PosFiscalEmissionMode {
    return new PosFiscalEmissionMode('OFFLINE_CONTINGENCY');
  }

  static NONE(): PosFiscalEmissionMode {
    return new PosFiscalEmissionMode('NONE');
  }

  get value(): PosFiscalEmissionModeValue {
    return this._value;
  }

  get isOnlineSync(): boolean {
    return this._value === 'ONLINE_SYNC';
  }

  get isOfflineContingency(): boolean {
    return this._value === 'OFFLINE_CONTINGENCY';
  }

  get isNone(): boolean {
    return this._value === 'NONE';
  }

  toString(): string {
    return this._value;
  }

  equals(other: PosFiscalEmissionMode): boolean {
    return this._value === other._value;
  }
}
