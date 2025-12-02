/**
 * Tipo de Ausência (Absence Type)
 * Value Object que representa os tipos de ausência do funcionário
 */

export type AbsenceTypeValue =
  | 'VACATION' // Férias
  | 'SICK_LEAVE' // Licença médica
  | 'PERSONAL_LEAVE' // Licença pessoal
  | 'MATERNITY_LEAVE' // Licença maternidade
  | 'PATERNITY_LEAVE' // Licença paternidade
  | 'BEREAVEMENT_LEAVE' // Luto
  | 'WEDDING_LEAVE' // Casamento (Gala)
  | 'MEDICAL_APPOINTMENT' // Consulta médica
  | 'JURY_DUTY' // Serviço do júri
  | 'UNPAID_LEAVE' // Licença não remunerada
  | 'OTHER'; // Outros

export const AbsenceTypeEnum = {
  VACATION: 'VACATION',
  SICK_LEAVE: 'SICK_LEAVE',
  PERSONAL_LEAVE: 'PERSONAL_LEAVE',
  MATERNITY_LEAVE: 'MATERNITY_LEAVE',
  PATERNITY_LEAVE: 'PATERNITY_LEAVE',
  BEREAVEMENT_LEAVE: 'BEREAVEMENT_LEAVE',
  WEDDING_LEAVE: 'WEDDING_LEAVE',
  MEDICAL_APPOINTMENT: 'MEDICAL_APPOINTMENT',
  JURY_DUTY: 'JURY_DUTY',
  UNPAID_LEAVE: 'UNPAID_LEAVE',
  OTHER: 'OTHER',
} as const;

export class AbsenceType {
  private readonly _value: AbsenceTypeValue;

  private constructor(value: AbsenceTypeValue) {
    this._value = value;
  }

  get value(): AbsenceTypeValue {
    return this._value;
  }

  static create(value: string): AbsenceType {
    const validTypes: AbsenceTypeValue[] = [
      'VACATION',
      'SICK_LEAVE',
      'PERSONAL_LEAVE',
      'MATERNITY_LEAVE',
      'PATERNITY_LEAVE',
      'BEREAVEMENT_LEAVE',
      'WEDDING_LEAVE',
      'MEDICAL_APPOINTMENT',
      'JURY_DUTY',
      'UNPAID_LEAVE',
      'OTHER',
    ];

    if (!validTypes.includes(value as AbsenceTypeValue)) {
      throw new Error(`Invalid absence type: ${value}`);
    }

    return new AbsenceType(value as AbsenceTypeValue);
  }

  // Static factory methods
  static vacation(): AbsenceType {
    return new AbsenceType('VACATION');
  }

  static sickLeave(): AbsenceType {
    return new AbsenceType('SICK_LEAVE');
  }

  static personalLeave(): AbsenceType {
    return new AbsenceType('PERSONAL_LEAVE');
  }

  static maternityLeave(): AbsenceType {
    return new AbsenceType('MATERNITY_LEAVE');
  }

  static paternityLeave(): AbsenceType {
    return new AbsenceType('PATERNITY_LEAVE');
  }

  static bereavementLeave(): AbsenceType {
    return new AbsenceType('BEREAVEMENT_LEAVE');
  }

  static weddingLeave(): AbsenceType {
    return new AbsenceType('WEDDING_LEAVE');
  }

  static medicalAppointment(): AbsenceType {
    return new AbsenceType('MEDICAL_APPOINTMENT');
  }

  static juryDuty(): AbsenceType {
    return new AbsenceType('JURY_DUTY');
  }

  static unpaidLeave(): AbsenceType {
    return new AbsenceType('UNPAID_LEAVE');
  }

  static other(): AbsenceType {
    return new AbsenceType('OTHER');
  }

  // Type checks
  isVacation(): boolean {
    return this._value === 'VACATION';
  }

  isSickLeave(): boolean {
    return this._value === 'SICK_LEAVE';
  }

  isPersonalLeave(): boolean {
    return this._value === 'PERSONAL_LEAVE';
  }

  isMaternityLeave(): boolean {
    return this._value === 'MATERNITY_LEAVE';
  }

  isPaternityLeave(): boolean {
    return this._value === 'PATERNITY_LEAVE';
  }

  isBereavementLeave(): boolean {
    return this._value === 'BEREAVEMENT_LEAVE';
  }

  isWeddingLeave(): boolean {
    return this._value === 'WEDDING_LEAVE';
  }

  isMedicalAppointment(): boolean {
    return this._value === 'MEDICAL_APPOINTMENT';
  }

  isJuryDuty(): boolean {
    return this._value === 'JURY_DUTY';
  }

  isUnpaidLeave(): boolean {
    return this._value === 'UNPAID_LEAVE';
  }

  isOther(): boolean {
    return this._value === 'OTHER';
  }

  // Categorizations
  isPaid(): boolean {
    return this._value !== 'UNPAID_LEAVE';
  }

  requiresApproval(): boolean {
    return ['VACATION', 'UNPAID_LEAVE', 'PERSONAL_LEAVE'].includes(this._value);
  }

  requiresDocument(): boolean {
    return [
      'SICK_LEAVE',
      'MATERNITY_LEAVE',
      'PATERNITY_LEAVE',
      'BEREAVEMENT_LEAVE',
      'WEDDING_LEAVE',
      'MEDICAL_APPOINTMENT',
      'JURY_DUTY',
    ].includes(this._value);
  }

  /**
   * Returns the maximum days allowed for this absence type according to Brazilian law
   */
  getMaxDays(): number | null {
    switch (this._value) {
      case 'VACATION':
        return 30;
      case 'MATERNITY_LEAVE':
        return 120; // Can be extended to 180
      case 'PATERNITY_LEAVE':
        return 5; // Can be extended to 20
      case 'BEREAVEMENT_LEAVE':
        return 2;
      case 'WEDDING_LEAVE':
        return 3;
      default:
        return null;
    }
  }

  toString(): string {
    return this._value;
  }

  equals(other: AbsenceType): boolean {
    return this._value === other.value;
  }
}
