/**
 * PayrollStatus Value Object
 * Represents the status of a payroll
 */

export type PayrollStatusValue =
  | 'DRAFT'
  | 'PROCESSING'
  | 'CALCULATED'
  | 'APPROVED'
  | 'PAID'
  | 'CANCELLED';

export const PayrollStatusEnum = {
  DRAFT: 'DRAFT' as const,
  PROCESSING: 'PROCESSING' as const,
  CALCULATED: 'CALCULATED' as const,
  APPROVED: 'APPROVED' as const,
  PAID: 'PAID' as const,
  CANCELLED: 'CANCELLED' as const,
};

export class PayrollStatus {
  private readonly _value: PayrollStatusValue;

  private constructor(value: PayrollStatusValue) {
    this._value = value;
  }

  get value(): PayrollStatusValue {
    return this._value;
  }

  static create(value: string): PayrollStatus {
    const upperValue = value.toUpperCase() as PayrollStatusValue;

    if (!Object.values(PayrollStatusEnum).includes(upperValue)) {
      throw new Error(`Invalid payroll status: ${value}`);
    }

    return new PayrollStatus(upperValue);
  }

  static DRAFT(): PayrollStatus {
    return new PayrollStatus(PayrollStatusEnum.DRAFT);
  }

  static PROCESSING(): PayrollStatus {
    return new PayrollStatus(PayrollStatusEnum.PROCESSING);
  }

  static CALCULATED(): PayrollStatus {
    return new PayrollStatus(PayrollStatusEnum.CALCULATED);
  }

  static APPROVED(): PayrollStatus {
    return new PayrollStatus(PayrollStatusEnum.APPROVED);
  }

  static PAID(): PayrollStatus {
    return new PayrollStatus(PayrollStatusEnum.PAID);
  }

  static CANCELLED(): PayrollStatus {
    return new PayrollStatus(PayrollStatusEnum.CANCELLED);
  }

  isDraft(): boolean {
    return this._value === PayrollStatusEnum.DRAFT;
  }

  isProcessing(): boolean {
    return this._value === PayrollStatusEnum.PROCESSING;
  }

  isCalculated(): boolean {
    return this._value === PayrollStatusEnum.CALCULATED;
  }

  isApproved(): boolean {
    return this._value === PayrollStatusEnum.APPROVED;
  }

  isPaid(): boolean {
    return this._value === PayrollStatusEnum.PAID;
  }

  isCancelled(): boolean {
    return this._value === PayrollStatusEnum.CANCELLED;
  }

  canBeProcessed(): boolean {
    return this._value === PayrollStatusEnum.DRAFT;
  }

  canBeApproved(): boolean {
    return this._value === PayrollStatusEnum.CALCULATED;
  }

  canBePaid(): boolean {
    return this._value === PayrollStatusEnum.APPROVED;
  }

  canBeCancelled(): boolean {
    return (
      this._value === PayrollStatusEnum.DRAFT ||
      this._value === PayrollStatusEnum.CALCULATED
    );
  }

  canBeEdited(): boolean {
    return (
      this._value === PayrollStatusEnum.DRAFT ||
      this._value === PayrollStatusEnum.PROCESSING
    );
  }

  equals(other: PayrollStatus): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
