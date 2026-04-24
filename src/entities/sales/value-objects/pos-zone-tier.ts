export type PosZoneTierValue = 'PRIMARY' | 'SECONDARY';

export class PosZoneTier {
  private readonly _value: PosZoneTierValue;

  private constructor(value: PosZoneTierValue) {
    this._value = value;
  }

  static create(value: string): PosZoneTier {
    const normalized = value.toUpperCase() as PosZoneTierValue;

    const validTiers: PosZoneTierValue[] = ['PRIMARY', 'SECONDARY'];

    if (!validTiers.includes(normalized)) {
      throw new Error(`Invalid PosZoneTier: ${value}`);
    }

    return new PosZoneTier(normalized);
  }

  static PRIMARY(): PosZoneTier {
    return new PosZoneTier('PRIMARY');
  }

  static SECONDARY(): PosZoneTier {
    return new PosZoneTier('SECONDARY');
  }

  get value(): PosZoneTierValue {
    return this._value;
  }

  get isPrimary(): boolean {
    return this._value === 'PRIMARY';
  }

  get isSecondary(): boolean {
    return this._value === 'SECONDARY';
  }

  toString(): string {
    return this._value;
  }

  equals(other: PosZoneTier): boolean {
    return this._value === other._value;
  }
}
