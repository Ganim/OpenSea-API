const VALID_STAGES = [
  'SUBSCRIBER',
  'LEAD',
  'QUALIFIED',
  'OPPORTUNITY',
  'CUSTOMER',
  'EVANGELIST',
] as const;

export type LifecycleStageValue = (typeof VALID_STAGES)[number];

export class LifecycleStage {
  private constructor(private readonly _value: LifecycleStageValue) {}

  get value(): LifecycleStageValue {
    return this._value;
  }

  static create(value: string): LifecycleStage {
    if (!VALID_STAGES.includes(value as LifecycleStageValue)) {
      throw new Error(
        `Invalid lifecycle stage: "${value}". Valid values: ${VALID_STAGES.join(', ')}`,
      );
    }
    return new LifecycleStage(value as LifecycleStageValue);
  }
}
