import { BadRequestError } from '@/@errors/use-cases/bad-request-error';

export type TimeEntryTypeValue =
  | 'CLOCK_IN'
  | 'CLOCK_OUT'
  | 'BREAK_START'
  | 'BREAK_END'
  | 'OVERTIME_START'
  | 'OVERTIME_END';

const VALID_TYPES: TimeEntryTypeValue[] = [
  'CLOCK_IN',
  'CLOCK_OUT',
  'BREAK_START',
  'BREAK_END',
  'OVERTIME_START',
  'OVERTIME_END',
];

export class TimeEntryType {
  private readonly _value: TimeEntryTypeValue;

  private constructor(value: TimeEntryTypeValue) {
    this._value = value;
  }

  get value(): TimeEntryTypeValue {
    return this._value;
  }

  static isValid(value: string): boolean {
    return VALID_TYPES.includes(value as TimeEntryTypeValue);
  }

  static create(value: string): TimeEntryType {
    if (!TimeEntryType.isValid(value)) {
      throw new BadRequestError(
        `Invalid time entry type: ${value}. Valid types are: ${VALID_TYPES.join(', ')}`,
      );
    }
    return new TimeEntryType(value as TimeEntryTypeValue);
  }

  // Factory methods
  static CLOCK_IN(): TimeEntryType {
    return new TimeEntryType('CLOCK_IN');
  }

  static CLOCK_OUT(): TimeEntryType {
    return new TimeEntryType('CLOCK_OUT');
  }

  static BREAK_START(): TimeEntryType {
    return new TimeEntryType('BREAK_START');
  }

  static BREAK_END(): TimeEntryType {
    return new TimeEntryType('BREAK_END');
  }

  static OVERTIME_START(): TimeEntryType {
    return new TimeEntryType('OVERTIME_START');
  }

  static OVERTIME_END(): TimeEntryType {
    return new TimeEntryType('OVERTIME_END');
  }

  // Business logic
  isClockIn(): boolean {
    return this._value === 'CLOCK_IN';
  }

  isClockOut(): boolean {
    return this._value === 'CLOCK_OUT';
  }

  isBreakStart(): boolean {
    return this._value === 'BREAK_START';
  }

  isBreakEnd(): boolean {
    return this._value === 'BREAK_END';
  }

  isOvertimeStart(): boolean {
    return this._value === 'OVERTIME_START';
  }

  isOvertimeEnd(): boolean {
    return this._value === 'OVERTIME_END';
  }

  isEntryType(): boolean {
    return (
      this._value === 'CLOCK_IN' ||
      this._value === 'BREAK_END' ||
      this._value === 'OVERTIME_START'
    );
  }

  isExitType(): boolean {
    return (
      this._value === 'CLOCK_OUT' ||
      this._value === 'BREAK_START' ||
      this._value === 'OVERTIME_END'
    );
  }

  toString(): string {
    return this._value;
  }

  equals(other: TimeEntryType): boolean {
    return this._value === other.value;
  }
}
