export type LifecycleStageValue =
  | 'SUBSCRIBER'
  | 'LEAD'
  | 'QUALIFIED'
  | 'OPPORTUNITY'
  | 'CUSTOMER'
  | 'EVANGELIST';

export class LifecycleStage {
  private static readonly VALID_VALUES: LifecycleStageValue[] = [
    'SUBSCRIBER',
    'LEAD',
    'QUALIFIED',
    'OPPORTUNITY',
    'CUSTOMER',
    'EVANGELIST',
  ];

  private readonly _value: LifecycleStageValue;

  private constructor(value: LifecycleStageValue) {
    this._value = value;
  }

  static create(value: string): LifecycleStage {
    const normalized = value.toUpperCase();

    if (!LifecycleStage.VALID_VALUES.includes(normalized as LifecycleStageValue)) {
      throw new Error(
        `Invalid LifecycleStage: "${value}". Valid values: ${LifecycleStage.VALID_VALUES.join(', ')}`,
      );
    }

    return new LifecycleStage(normalized as LifecycleStageValue);
  }

  get value(): LifecycleStageValue {
    return this._value;
  }

  get isSubscriber(): boolean {
    return this._value === 'SUBSCRIBER';
  }

  get isLead(): boolean {
    return this._value === 'LEAD';
  }

  get isQualified(): boolean {
    return this._value === 'QUALIFIED';
  }

  get isOpportunity(): boolean {
    return this._value === 'OPPORTUNITY';
  }

  get isCustomer(): boolean {
    return this._value === 'CUSTOMER';
  }

  get isEvangelist(): boolean {
    return this._value === 'EVANGELIST';
  }

  toString(): string {
    return this._value;
  }

  equals(other: LifecycleStage): boolean {
    return this._value === other._value;
  }
}
