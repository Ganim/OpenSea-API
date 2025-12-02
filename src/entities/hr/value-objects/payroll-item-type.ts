/**
 * PayrollItemType Value Object
 * Represents the type of a payroll item (earnings or deductions)
 */

export type PayrollItemTypeValue =
  | 'BASE_SALARY'
  | 'OVERTIME'
  | 'NIGHT_SHIFT'
  | 'HAZARD_PAY'
  | 'DANGER_PAY'
  | 'BONUS'
  | 'COMMISSION'
  | 'VACATION_PAY'
  | 'THIRTEENTH_SALARY'
  | 'INSS'
  | 'IRRF'
  | 'FGTS'
  | 'HEALTH_PLAN'
  | 'DENTAL_PLAN'
  | 'TRANSPORT_VOUCHER'
  | 'MEAL_VOUCHER'
  | 'OTHER_BENEFIT'
  | 'ADVANCE'
  | 'LOAN'
  | 'OTHER_DEDUCTION';

export const PayrollItemTypeEnum = {
  BASE_SALARY: 'BASE_SALARY' as const,
  OVERTIME: 'OVERTIME' as const,
  NIGHT_SHIFT: 'NIGHT_SHIFT' as const,
  HAZARD_PAY: 'HAZARD_PAY' as const,
  DANGER_PAY: 'DANGER_PAY' as const,
  BONUS: 'BONUS' as const,
  COMMISSION: 'COMMISSION' as const,
  VACATION_PAY: 'VACATION_PAY' as const,
  THIRTEENTH_SALARY: 'THIRTEENTH_SALARY' as const,
  INSS: 'INSS' as const,
  IRRF: 'IRRF' as const,
  FGTS: 'FGTS' as const,
  HEALTH_PLAN: 'HEALTH_PLAN' as const,
  DENTAL_PLAN: 'DENTAL_PLAN' as const,
  TRANSPORT_VOUCHER: 'TRANSPORT_VOUCHER' as const,
  MEAL_VOUCHER: 'MEAL_VOUCHER' as const,
  OTHER_BENEFIT: 'OTHER_BENEFIT' as const,
  ADVANCE: 'ADVANCE' as const,
  LOAN: 'LOAN' as const,
  OTHER_DEDUCTION: 'OTHER_DEDUCTION' as const,
};

// Types that are deductions (will be subtracted from gross salary)
const DEDUCTION_TYPES: PayrollItemTypeValue[] = [
  PayrollItemTypeEnum.INSS,
  PayrollItemTypeEnum.IRRF,
  PayrollItemTypeEnum.FGTS,
  PayrollItemTypeEnum.HEALTH_PLAN,
  PayrollItemTypeEnum.DENTAL_PLAN,
  PayrollItemTypeEnum.TRANSPORT_VOUCHER,
  PayrollItemTypeEnum.MEAL_VOUCHER,
  PayrollItemTypeEnum.ADVANCE,
  PayrollItemTypeEnum.LOAN,
  PayrollItemTypeEnum.OTHER_DEDUCTION,
];

// Types that are earnings (will be added to gross salary)
const EARNING_TYPES: PayrollItemTypeValue[] = [
  PayrollItemTypeEnum.BASE_SALARY,
  PayrollItemTypeEnum.OVERTIME,
  PayrollItemTypeEnum.NIGHT_SHIFT,
  PayrollItemTypeEnum.HAZARD_PAY,
  PayrollItemTypeEnum.DANGER_PAY,
  PayrollItemTypeEnum.BONUS,
  PayrollItemTypeEnum.COMMISSION,
  PayrollItemTypeEnum.VACATION_PAY,
  PayrollItemTypeEnum.THIRTEENTH_SALARY,
  PayrollItemTypeEnum.OTHER_BENEFIT,
];

export class PayrollItemType {
  private readonly _value: PayrollItemTypeValue;

  private constructor(value: PayrollItemTypeValue) {
    this._value = value;
  }

  get value(): PayrollItemTypeValue {
    return this._value;
  }

  static create(value: string): PayrollItemType {
    const upperValue = value.toUpperCase() as PayrollItemTypeValue;

    if (!Object.values(PayrollItemTypeEnum).includes(upperValue)) {
      throw new Error(`Invalid payroll item type: ${value}`);
    }

    return new PayrollItemType(upperValue);
  }

  // Factory methods for earnings
  static BASE_SALARY(): PayrollItemType {
    return new PayrollItemType(PayrollItemTypeEnum.BASE_SALARY);
  }

  static OVERTIME(): PayrollItemType {
    return new PayrollItemType(PayrollItemTypeEnum.OVERTIME);
  }

  static NIGHT_SHIFT(): PayrollItemType {
    return new PayrollItemType(PayrollItemTypeEnum.NIGHT_SHIFT);
  }

  static HAZARD_PAY(): PayrollItemType {
    return new PayrollItemType(PayrollItemTypeEnum.HAZARD_PAY);
  }

  static DANGER_PAY(): PayrollItemType {
    return new PayrollItemType(PayrollItemTypeEnum.DANGER_PAY);
  }

  static BONUS(): PayrollItemType {
    return new PayrollItemType(PayrollItemTypeEnum.BONUS);
  }

  static COMMISSION(): PayrollItemType {
    return new PayrollItemType(PayrollItemTypeEnum.COMMISSION);
  }

  static VACATION_PAY(): PayrollItemType {
    return new PayrollItemType(PayrollItemTypeEnum.VACATION_PAY);
  }

  static THIRTEENTH_SALARY(): PayrollItemType {
    return new PayrollItemType(PayrollItemTypeEnum.THIRTEENTH_SALARY);
  }

  // Factory methods for deductions
  static INSS(): PayrollItemType {
    return new PayrollItemType(PayrollItemTypeEnum.INSS);
  }

  static IRRF(): PayrollItemType {
    return new PayrollItemType(PayrollItemTypeEnum.IRRF);
  }

  static FGTS(): PayrollItemType {
    return new PayrollItemType(PayrollItemTypeEnum.FGTS);
  }

  static HEALTH_PLAN(): PayrollItemType {
    return new PayrollItemType(PayrollItemTypeEnum.HEALTH_PLAN);
  }

  static DENTAL_PLAN(): PayrollItemType {
    return new PayrollItemType(PayrollItemTypeEnum.DENTAL_PLAN);
  }

  static TRANSPORT_VOUCHER(): PayrollItemType {
    return new PayrollItemType(PayrollItemTypeEnum.TRANSPORT_VOUCHER);
  }

  static MEAL_VOUCHER(): PayrollItemType {
    return new PayrollItemType(PayrollItemTypeEnum.MEAL_VOUCHER);
  }

  static ADVANCE(): PayrollItemType {
    return new PayrollItemType(PayrollItemTypeEnum.ADVANCE);
  }

  static LOAN(): PayrollItemType {
    return new PayrollItemType(PayrollItemTypeEnum.LOAN);
  }

  static OTHER_DEDUCTION(): PayrollItemType {
    return new PayrollItemType(PayrollItemTypeEnum.OTHER_DEDUCTION);
  }

  static OTHER_BENEFIT(): PayrollItemType {
    return new PayrollItemType(PayrollItemTypeEnum.OTHER_BENEFIT);
  }

  isDeduction(): boolean {
    return DEDUCTION_TYPES.includes(this._value);
  }

  isEarning(): boolean {
    return EARNING_TYPES.includes(this._value);
  }

  isTax(): boolean {
    return (
      this._value === PayrollItemTypeEnum.INSS ||
      this._value === PayrollItemTypeEnum.IRRF ||
      this._value === PayrollItemTypeEnum.FGTS
    );
  }

  isBenefit(): boolean {
    return (
      this._value === PayrollItemTypeEnum.HEALTH_PLAN ||
      this._value === PayrollItemTypeEnum.DENTAL_PLAN ||
      this._value === PayrollItemTypeEnum.TRANSPORT_VOUCHER ||
      this._value === PayrollItemTypeEnum.MEAL_VOUCHER ||
      this._value === PayrollItemTypeEnum.OTHER_BENEFIT
    );
  }

  isBonus(): boolean {
    return (
      this._value === PayrollItemTypeEnum.BONUS ||
      this._value === PayrollItemTypeEnum.COMMISSION
    );
  }

  equals(other: PayrollItemType): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
