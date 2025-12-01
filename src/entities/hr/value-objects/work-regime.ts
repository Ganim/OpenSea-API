import { ValueObject } from './cpf';

export enum WorkRegimeEnum {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  HOURLY = 'HOURLY',
  SHIFT = 'SHIFT',
  FLEXIBLE = 'FLEXIBLE',
}

export class WorkRegime extends ValueObject<WorkRegimeEnum> {
  private constructor(value: WorkRegimeEnum) {
    super(value);
  }

  static create(regime: WorkRegimeEnum | string): WorkRegime {
    // If it's already an enum value, use it directly
    if (Object.values(WorkRegimeEnum).includes(regime as WorkRegimeEnum)) {
      return new WorkRegime(regime as WorkRegimeEnum);
    }
    // If it's a string, try to match it to an enum value
    const enumValue = Object.values(WorkRegimeEnum).find(v => v === regime);
    if (!enumValue) {
      throw new Error(`Invalid work regime: ${regime}`);
    }
    return new WorkRegime(enumValue);
  }

  static FULL_TIME(): WorkRegime {
    return new WorkRegime(WorkRegimeEnum.FULL_TIME);
  }

  static PART_TIME(): WorkRegime {
    return new WorkRegime(WorkRegimeEnum.PART_TIME);
  }

  static HOURLY(): WorkRegime {
    return new WorkRegime(WorkRegimeEnum.HOURLY);
  }

  static SHIFT(): WorkRegime {
    return new WorkRegime(WorkRegimeEnum.SHIFT);
  }

  static FLEXIBLE(): WorkRegime {
    return new WorkRegime(WorkRegimeEnum.FLEXIBLE);
  }

  get value(): WorkRegimeEnum {
    return this._value;
  }

  isFullTime(): boolean {
    return this._value === WorkRegimeEnum.FULL_TIME;
  }

  isPartTime(): boolean {
    return this._value === WorkRegimeEnum.PART_TIME;
  }

  isHourly(): boolean {
    return this._value === WorkRegimeEnum.HOURLY;
  }

  isShift(): boolean {
    return this._value === WorkRegimeEnum.SHIFT;
  }

  isFlexible(): boolean {
    return this._value === WorkRegimeEnum.FLEXIBLE;
  }

  requiresTimeTracking(): boolean {
    return this.isHourly() || this.isShift() || this.isFlexible();
  }

  hasFixedSchedule(): boolean {
    return this.isFullTime() || this.isPartTime() || this.isShift();
  }

  equals(other: ValueObject<WorkRegimeEnum>): boolean {
    if (!(other instanceof WorkRegime)) return false;
    return super.equals(other);
  }
}
