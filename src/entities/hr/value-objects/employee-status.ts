import { ValueObject } from './cpf';

export enum EmployeeStatusEnum {
  ACTIVE = 'ACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  VACATION = 'VACATION',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED',
}

export class EmployeeStatus extends ValueObject<EmployeeStatusEnum> {
  private constructor(value: EmployeeStatusEnum) {
    super(value);
  }

  static create(status: EmployeeStatusEnum | string): EmployeeStatus {
    // If it's already an enum value, use it directly
    if (
      Object.values(EmployeeStatusEnum).includes(status as EmployeeStatusEnum)
    ) {
      return new EmployeeStatus(status as EmployeeStatusEnum);
    }
    // If it's a string, try to match it to an enum value
    const enumValue = Object.values(EmployeeStatusEnum).find(
      (v) => v === status,
    );
    if (!enumValue) {
      throw new Error(`Invalid employee status: ${status}`);
    }
    return new EmployeeStatus(enumValue);
  }

  static ACTIVE(): EmployeeStatus {
    return new EmployeeStatus(EmployeeStatusEnum.ACTIVE);
  }

  static ON_LEAVE(): EmployeeStatus {
    return new EmployeeStatus(EmployeeStatusEnum.ON_LEAVE);
  }

  static VACATION(): EmployeeStatus {
    return new EmployeeStatus(EmployeeStatusEnum.VACATION);
  }

  static SUSPENDED(): EmployeeStatus {
    return new EmployeeStatus(EmployeeStatusEnum.SUSPENDED);
  }

  static TERMINATED(): EmployeeStatus {
    return new EmployeeStatus(EmployeeStatusEnum.TERMINATED);
  }

  get value(): EmployeeStatusEnum {
    return this._value;
  }

  isActive(): boolean {
    return this._value === EmployeeStatusEnum.ACTIVE;
  }

  isOnLeave(): boolean {
    return this._value === EmployeeStatusEnum.ON_LEAVE;
  }

  isOnVacation(): boolean {
    return this._value === EmployeeStatusEnum.VACATION;
  }

  isSuspended(): boolean {
    return this._value === EmployeeStatusEnum.SUSPENDED;
  }

  isTerminated(): boolean {
    return this._value === EmployeeStatusEnum.TERMINATED;
  }

  canWork(): boolean {
    return this.isActive() || this.isOnLeave();
  }

  equals(other: ValueObject<EmployeeStatusEnum>): boolean {
    if (!(other instanceof EmployeeStatus)) return false;
    return super.equals(other);
  }
}
