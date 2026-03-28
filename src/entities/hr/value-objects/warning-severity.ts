/**
 * Gravidade da Advertência (Warning Severity)
 * Value Object que representa a gravidade de uma advertência disciplinar
 */

export type WarningSeverityValue =
  | 'LOW' // Baixa
  | 'MEDIUM' // Média
  | 'HIGH' // Alta
  | 'CRITICAL'; // Crítica

export const WarningSeverityEnum = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;

export class WarningSeverity {
  private readonly _value: WarningSeverityValue;

  private constructor(value: WarningSeverityValue) {
    this._value = value;
  }

  get value(): WarningSeverityValue {
    return this._value;
  }

  static create(value: string): WarningSeverity {
    const validSeverities: WarningSeverityValue[] = [
      'LOW',
      'MEDIUM',
      'HIGH',
      'CRITICAL',
    ];

    if (!validSeverities.includes(value as WarningSeverityValue)) {
      throw new Error(`Invalid warning severity: ${value}`);
    }

    return new WarningSeverity(value as WarningSeverityValue);
  }

  static low(): WarningSeverity {
    return new WarningSeverity('LOW');
  }

  static medium(): WarningSeverity {
    return new WarningSeverity('MEDIUM');
  }

  static high(): WarningSeverity {
    return new WarningSeverity('HIGH');
  }

  static critical(): WarningSeverity {
    return new WarningSeverity('CRITICAL');
  }

  isLow(): boolean {
    return this._value === 'LOW';
  }

  isMedium(): boolean {
    return this._value === 'MEDIUM';
  }

  isHigh(): boolean {
    return this._value === 'HIGH';
  }

  isCritical(): boolean {
    return this._value === 'CRITICAL';
  }

  toString(): string {
    return this._value;
  }

  equals(other: WarningSeverity): boolean {
    return this._value === other.value;
  }
}
