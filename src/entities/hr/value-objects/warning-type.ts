/**
 * Tipo de Advertência (Warning Type)
 * Value Object que representa o tipo de uma advertência disciplinar
 */

export type WarningTypeValue =
  | 'VERBAL' // Advertência verbal
  | 'WRITTEN' // Advertência escrita
  | 'SUSPENSION' // Suspensão
  | 'TERMINATION_WARNING'; // Aviso de desligamento

export const WarningTypeEnum = {
  VERBAL: 'VERBAL',
  WRITTEN: 'WRITTEN',
  SUSPENSION: 'SUSPENSION',
  TERMINATION_WARNING: 'TERMINATION_WARNING',
} as const;

export class WarningType {
  private readonly _value: WarningTypeValue;

  private constructor(value: WarningTypeValue) {
    this._value = value;
  }

  get value(): WarningTypeValue {
    return this._value;
  }

  static create(value: string): WarningType {
    const validTypes: WarningTypeValue[] = [
      'VERBAL',
      'WRITTEN',
      'SUSPENSION',
      'TERMINATION_WARNING',
    ];

    if (!validTypes.includes(value as WarningTypeValue)) {
      throw new Error(`Invalid warning type: ${value}`);
    }

    return new WarningType(value as WarningTypeValue);
  }

  static verbal(): WarningType {
    return new WarningType('VERBAL');
  }

  static written(): WarningType {
    return new WarningType('WRITTEN');
  }

  static suspension(): WarningType {
    return new WarningType('SUSPENSION');
  }

  static terminationWarning(): WarningType {
    return new WarningType('TERMINATION_WARNING');
  }

  isVerbal(): boolean {
    return this._value === 'VERBAL';
  }

  isWritten(): boolean {
    return this._value === 'WRITTEN';
  }

  isSuspension(): boolean {
    return this._value === 'SUSPENSION';
  }

  isTerminationWarning(): boolean {
    return this._value === 'TERMINATION_WARNING';
  }

  toString(): string {
    return this._value;
  }

  equals(other: WarningType): boolean {
    return this._value === other.value;
  }
}
