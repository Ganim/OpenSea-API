/**
 * Status da Ausência (Absence Status)
 * Value Object que representa o status de uma ausência
 */

export type AbsenceStatusValue =
  | 'PENDING' // Pendente de aprovação
  | 'APPROVED' // Aprovada
  | 'REJECTED' // Rejeitada
  | 'CANCELLED' // Cancelada
  | 'IN_PROGRESS' // Em andamento
  | 'COMPLETED'; // Concluída

export const AbsenceStatusEnum = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const;

export class AbsenceStatus {
  private readonly _value: AbsenceStatusValue;

  private constructor(value: AbsenceStatusValue) {
    this._value = value;
  }

  get value(): AbsenceStatusValue {
    return this._value;
  }

  static create(value: string): AbsenceStatus {
    const validStatuses: AbsenceStatusValue[] = [
      'PENDING',
      'APPROVED',
      'REJECTED',
      'CANCELLED',
      'IN_PROGRESS',
      'COMPLETED',
    ];

    if (!validStatuses.includes(value as AbsenceStatusValue)) {
      throw new Error(`Invalid absence status: ${value}`);
    }

    return new AbsenceStatus(value as AbsenceStatusValue);
  }

  static pending(): AbsenceStatus {
    return new AbsenceStatus('PENDING');
  }

  static approved(): AbsenceStatus {
    return new AbsenceStatus('APPROVED');
  }

  static rejected(): AbsenceStatus {
    return new AbsenceStatus('REJECTED');
  }

  static cancelled(): AbsenceStatus {
    return new AbsenceStatus('CANCELLED');
  }

  static inProgress(): AbsenceStatus {
    return new AbsenceStatus('IN_PROGRESS');
  }

  static completed(): AbsenceStatus {
    return new AbsenceStatus('COMPLETED');
  }

  // Status checks
  isPending(): boolean {
    return this._value === 'PENDING';
  }

  isApproved(): boolean {
    return this._value === 'APPROVED';
  }

  isRejected(): boolean {
    return this._value === 'REJECTED';
  }

  isCancelled(): boolean {
    return this._value === 'CANCELLED';
  }

  isInProgress(): boolean {
    return this._value === 'IN_PROGRESS';
  }

  isCompleted(): boolean {
    return this._value === 'COMPLETED';
  }

  // Transition checks
  canBeApproved(): boolean {
    return this._value === 'PENDING';
  }

  canBeRejected(): boolean {
    return this._value === 'PENDING';
  }

  canBeCancelled(): boolean {
    return ['PENDING', 'APPROVED'].includes(this._value);
  }

  canStartProgress(): boolean {
    return this._value === 'APPROVED';
  }

  canBeCompleted(): boolean {
    return this._value === 'IN_PROGRESS';
  }

  // Is active (not finalized)
  isActive(): boolean {
    return ['PENDING', 'APPROVED', 'IN_PROGRESS'].includes(this._value);
  }

  // Is finalized
  isFinalized(): boolean {
    return ['REJECTED', 'CANCELLED', 'COMPLETED'].includes(this._value);
  }

  toString(): string {
    return this._value;
  }

  equals(other: AbsenceStatus): boolean {
    return this._value === other.value;
  }
}
