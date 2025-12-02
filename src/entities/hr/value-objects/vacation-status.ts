/**
 * Status do Período de Férias (Vacation Status)
 * Value Object que representa o status de um período aquisitivo/concessivo de férias
 */

export type VacationStatusValue =
  | 'PENDING' // Período aquisitivo em andamento
  | 'AVAILABLE' // Disponível para gozo
  | 'SCHEDULED' // Agendada
  | 'IN_PROGRESS' // Em gozo
  | 'COMPLETED' // Concluída
  | 'EXPIRED' // Vencida (período concessivo expirado)
  | 'SOLD'; // Vendida (abono pecuniário)

export const VacationStatusEnum = {
  PENDING: 'PENDING',
  AVAILABLE: 'AVAILABLE',
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  EXPIRED: 'EXPIRED',
  SOLD: 'SOLD',
} as const;

export class VacationStatus {
  private readonly _value: VacationStatusValue;

  private constructor(value: VacationStatusValue) {
    this._value = value;
  }

  get value(): VacationStatusValue {
    return this._value;
  }

  static create(value: string): VacationStatus {
    const validStatuses: VacationStatusValue[] = [
      'PENDING',
      'AVAILABLE',
      'SCHEDULED',
      'IN_PROGRESS',
      'COMPLETED',
      'EXPIRED',
      'SOLD',
    ];

    if (!validStatuses.includes(value as VacationStatusValue)) {
      throw new Error(`Invalid vacation status: ${value}`);
    }

    return new VacationStatus(value as VacationStatusValue);
  }

  static pending(): VacationStatus {
    return new VacationStatus('PENDING');
  }

  static available(): VacationStatus {
    return new VacationStatus('AVAILABLE');
  }

  static scheduled(): VacationStatus {
    return new VacationStatus('SCHEDULED');
  }

  static inProgress(): VacationStatus {
    return new VacationStatus('IN_PROGRESS');
  }

  static completed(): VacationStatus {
    return new VacationStatus('COMPLETED');
  }

  static expired(): VacationStatus {
    return new VacationStatus('EXPIRED');
  }

  static sold(): VacationStatus {
    return new VacationStatus('SOLD');
  }

  // Status checks
  isPending(): boolean {
    return this._value === 'PENDING';
  }

  isAvailable(): boolean {
    return this._value === 'AVAILABLE';
  }

  isScheduled(): boolean {
    return this._value === 'SCHEDULED';
  }

  isInProgress(): boolean {
    return this._value === 'IN_PROGRESS';
  }

  isCompleted(): boolean {
    return this._value === 'COMPLETED';
  }

  isExpired(): boolean {
    return this._value === 'EXPIRED';
  }

  isSold(): boolean {
    return this._value === 'SOLD';
  }

  // Can be scheduled for vacation
  canSchedule(): boolean {
    return this._value === 'AVAILABLE';
  }

  // Can cancel scheduled vacation
  canCancel(): boolean {
    return this._value === 'SCHEDULED';
  }

  // Can start vacation
  canStart(): boolean {
    return this._value === 'SCHEDULED';
  }

  // Can complete vacation
  canComplete(): boolean {
    return this._value === 'IN_PROGRESS';
  }

  // Can sell vacation days (abono pecuniário)
  canSell(): boolean {
    return ['AVAILABLE', 'SCHEDULED'].includes(this._value);
  }

  // Is usable (can take vacation)
  isUsable(): boolean {
    return ['AVAILABLE', 'SCHEDULED'].includes(this._value);
  }

  // Is finalized
  isFinalized(): boolean {
    return ['COMPLETED', 'EXPIRED', 'SOLD'].includes(this._value);
  }

  toString(): string {
    return this._value;
  }

  equals(other: VacationStatus): boolean {
    return this._value === other.value;
  }
}
