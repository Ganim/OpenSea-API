/**
 * Status da Advertência (Warning Status)
 * Value Object que representa o status de uma advertência disciplinar
 */

export type WarningStatusValue =
  | 'ACTIVE' // Ativa
  | 'REVOKED' // Revogada
  | 'EXPIRED'; // Expirada

export const WarningStatusEnum = {
  ACTIVE: 'ACTIVE',
  REVOKED: 'REVOKED',
  EXPIRED: 'EXPIRED',
} as const;

export class WarningStatus {
  private readonly _value: WarningStatusValue;

  private constructor(value: WarningStatusValue) {
    this._value = value;
  }

  get value(): WarningStatusValue {
    return this._value;
  }

  static create(value: string): WarningStatus {
    const validStatuses: WarningStatusValue[] = [
      'ACTIVE',
      'REVOKED',
      'EXPIRED',
    ];

    if (!validStatuses.includes(value as WarningStatusValue)) {
      throw new Error(`Invalid warning status: ${value}`);
    }

    return new WarningStatus(value as WarningStatusValue);
  }

  static active(): WarningStatus {
    return new WarningStatus('ACTIVE');
  }

  static revoked(): WarningStatus {
    return new WarningStatus('REVOKED');
  }

  static expired(): WarningStatus {
    return new WarningStatus('EXPIRED');
  }

  isActive(): boolean {
    return this._value === 'ACTIVE';
  }

  isRevoked(): boolean {
    return this._value === 'REVOKED';
  }

  isExpired(): boolean {
    return this._value === 'EXPIRED';
  }

  canBeRevoked(): boolean {
    return this._value === 'ACTIVE';
  }

  toString(): string {
    return this._value;
  }

  equals(other: WarningStatus): boolean {
    return this._value === other.value;
  }
}
