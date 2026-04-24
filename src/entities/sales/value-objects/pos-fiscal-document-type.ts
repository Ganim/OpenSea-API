export type PosFiscalDocumentTypeValue = 'NFE' | 'NFC_E' | 'SAT_CFE' | 'MFE';

export class PosFiscalDocumentType {
  private readonly _value: PosFiscalDocumentTypeValue;

  private constructor(value: PosFiscalDocumentTypeValue) {
    this._value = value;
  }

  static create(value: string): PosFiscalDocumentType {
    const normalized = value.toUpperCase() as PosFiscalDocumentTypeValue;

    const validTypes: PosFiscalDocumentTypeValue[] = [
      'NFE',
      'NFC_E',
      'SAT_CFE',
      'MFE',
    ];

    if (!validTypes.includes(normalized)) {
      throw new Error(`Invalid PosFiscalDocumentType: ${value}`);
    }

    return new PosFiscalDocumentType(normalized);
  }

  static NFE(): PosFiscalDocumentType {
    return new PosFiscalDocumentType('NFE');
  }

  static NFC_E(): PosFiscalDocumentType {
    return new PosFiscalDocumentType('NFC_E');
  }

  static SAT_CFE(): PosFiscalDocumentType {
    return new PosFiscalDocumentType('SAT_CFE');
  }

  static MFE(): PosFiscalDocumentType {
    return new PosFiscalDocumentType('MFE');
  }

  get value(): PosFiscalDocumentTypeValue {
    return this._value;
  }

  get isNfe(): boolean {
    return this._value === 'NFE';
  }

  get isNfcE(): boolean {
    return this._value === 'NFC_E';
  }

  get isSatCfe(): boolean {
    return this._value === 'SAT_CFE';
  }

  get isMfe(): boolean {
    return this._value === 'MFE';
  }

  toString(): string {
    return this._value;
  }

  equals(other: PosFiscalDocumentType): boolean {
    return this._value === other._value;
  }
}
