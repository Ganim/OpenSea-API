export type PosOrderConflictStatusValue =
  | 'PENDING_RESOLUTION'
  | 'AUTO_SUBSTITUTED'
  | 'AUTO_ADJUSTED'
  | 'CANCELED_REFUNDED'
  | 'FORCED_ADJUSTMENT'
  | 'ITEM_SUBSTITUTED_MANUAL'
  | 'EXPIRED';

export class PosOrderConflictStatus {
  private readonly _value: PosOrderConflictStatusValue;

  private constructor(value: PosOrderConflictStatusValue) {
    this._value = value;
  }

  static create(value: string): PosOrderConflictStatus {
    const normalized = value.toUpperCase() as PosOrderConflictStatusValue;

    const validStatuses: PosOrderConflictStatusValue[] = [
      'PENDING_RESOLUTION',
      'AUTO_SUBSTITUTED',
      'AUTO_ADJUSTED',
      'CANCELED_REFUNDED',
      'FORCED_ADJUSTMENT',
      'ITEM_SUBSTITUTED_MANUAL',
      'EXPIRED',
    ];

    if (!validStatuses.includes(normalized)) {
      throw new Error(`Invalid PosOrderConflictStatus: ${value}`);
    }

    return new PosOrderConflictStatus(normalized);
  }

  static PENDING_RESOLUTION(): PosOrderConflictStatus {
    return new PosOrderConflictStatus('PENDING_RESOLUTION');
  }

  static AUTO_SUBSTITUTED(): PosOrderConflictStatus {
    return new PosOrderConflictStatus('AUTO_SUBSTITUTED');
  }

  static AUTO_ADJUSTED(): PosOrderConflictStatus {
    return new PosOrderConflictStatus('AUTO_ADJUSTED');
  }

  static CANCELED_REFUNDED(): PosOrderConflictStatus {
    return new PosOrderConflictStatus('CANCELED_REFUNDED');
  }

  static FORCED_ADJUSTMENT(): PosOrderConflictStatus {
    return new PosOrderConflictStatus('FORCED_ADJUSTMENT');
  }

  static ITEM_SUBSTITUTED_MANUAL(): PosOrderConflictStatus {
    return new PosOrderConflictStatus('ITEM_SUBSTITUTED_MANUAL');
  }

  static EXPIRED(): PosOrderConflictStatus {
    return new PosOrderConflictStatus('EXPIRED');
  }

  get value(): PosOrderConflictStatusValue {
    return this._value;
  }

  get isPendingResolution(): boolean {
    return this._value === 'PENDING_RESOLUTION';
  }

  get isAutoSubstituted(): boolean {
    return this._value === 'AUTO_SUBSTITUTED';
  }

  get isAutoAdjusted(): boolean {
    return this._value === 'AUTO_ADJUSTED';
  }

  get isCanceledRefunded(): boolean {
    return this._value === 'CANCELED_REFUNDED';
  }

  get isForcedAdjustment(): boolean {
    return this._value === 'FORCED_ADJUSTMENT';
  }

  get isItemSubstitutedManual(): boolean {
    return this._value === 'ITEM_SUBSTITUTED_MANUAL';
  }

  get isExpired(): boolean {
    return this._value === 'EXPIRED';
  }

  get isResolved(): boolean {
    return (
      this._value === 'AUTO_SUBSTITUTED' ||
      this._value === 'AUTO_ADJUSTED' ||
      this._value === 'CANCELED_REFUNDED' ||
      this._value === 'FORCED_ADJUSTMENT' ||
      this._value === 'ITEM_SUBSTITUTED_MANUAL'
    );
  }

  toString(): string {
    return this._value;
  }

  equals(other: PosOrderConflictStatus): boolean {
    return this._value === other._value;
  }
}
