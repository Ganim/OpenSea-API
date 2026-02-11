const BANK_CODES: Record<string, string> = {
  '001': 'Banco do Brasil',
  '033': 'Santander',
  '041': 'Banrisul',
  '077': 'Inter',
  '104': 'Caixa Econômica',
  '212': 'Banco Original',
  '237': 'Bradesco',
  '260': 'Nubank',
  '341': 'Itaú',
  '389': 'Mercantil',
  '422': 'Safra',
  '748': 'Sicredi',
  '756': 'Sicoob',
};

const BASE_DATE = new Date(1997, 9, 7); // Oct 7, 1997

export interface BoletoParseResult {
  bankCode: string;
  bankName: string;
  dueDate: Date;
  amount: number;
  barcode: string;
  digitLine: string;
}

export class BoletoBarcode {
  private readonly barcode: string;

  private constructor(barcode: string) {
    this.barcode = barcode;
  }

  static fromBarcode(input: string): BoletoBarcode | null {
    const cleaned = input.replace(/[^\d]/g, '');
    if (cleaned.length !== 44) return null;
    if (!BoletoBarcode.validateBarcodeCheckDigit(cleaned)) return null;
    return new BoletoBarcode(cleaned);
  }

  static fromDigitLine(input: string): BoletoBarcode | null {
    const cleaned = input.replace(/[^\d]/g, '');
    if (cleaned.length !== 47) return null;
    const barcode = BoletoBarcode.digitLineToBarcode(cleaned);
    if (!BoletoBarcode.validateBarcodeCheckDigit(barcode)) return null;
    return new BoletoBarcode(barcode);
  }

  static parse(input: string): BoletoBarcode | null {
    const cleaned = input.replace(/[^\d]/g, '');
    if (cleaned.length === 44) return BoletoBarcode.fromBarcode(input);
    if (cleaned.length === 47) return BoletoBarcode.fromDigitLine(input);
    return null;
  }

  get bankCode(): string {
    return this.barcode.substring(0, 3);
  }

  get bankName(): string {
    return BANK_CODES[this.bankCode] ?? 'Desconhecido';
  }

  get dueDate(): Date {
    const factor = parseInt(this.barcode.substring(5, 9), 10);
    if (factor === 0) return new Date();
    const ms = BASE_DATE.getTime() + factor * 24 * 60 * 60 * 1000;
    return new Date(ms);
  }

  get amount(): number {
    const raw = parseInt(this.barcode.substring(9, 19), 10);
    return raw / 100;
  }

  toBarcode(): string {
    return this.barcode;
  }

  toDigitLine(): string {
    return BoletoBarcode.barcodeToDigitLine(this.barcode);
  }

  toResult(): BoletoParseResult {
    return {
      bankCode: this.bankCode,
      bankName: this.bankName,
      dueDate: this.dueDate,
      amount: this.amount,
      barcode: this.barcode,
      digitLine: this.toDigitLine(),
    };
  }

  // Barcode format (44 digits):
  // [0-2] bank code, [3] currency (9=BRL), [4] check digit,
  // [5-8] due date factor, [9-18] amount, [19-43] free field
  private static validateBarcodeCheckDigit(barcode: string): boolean {
    const digits = barcode.split('').map(Number);
    const checkDigit = digits[4];

    // Build number without check digit position
    const withoutCheck = [...digits.slice(0, 4), ...digits.slice(5)];

    const weights = BoletoBarcode.computeMod11(withoutCheck);
    const remainder = weights % 11;
    let expected: number;

    if (remainder === 0 || remainder === 1 || remainder === 10) {
      expected = 1;
    } else {
      expected = 11 - remainder;
    }

    return checkDigit === expected;
  }

  private static computeMod11(digits: number[]): number {
    let weight = 2;
    let sum = 0;

    for (let i = digits.length - 1; i >= 0; i--) {
      sum += digits[i] * weight;
      weight = weight >= 9 ? 2 : weight + 1;
    }

    return sum;
  }

  // Convert 47-digit line to 44-digit barcode
  // Digit line: AAABK.CCCCD EEEEE.FFFFG HHHHH.IIIJJ K UUUUVVVVVVVVVV
  // Barcode:    AAAB K UUUU VVVVVVVVVV CCCCEEEEEFFFFHHHHHIII JJ
  private static digitLineToBarcode(line: string): string {
    const bankAndCurrency = line.substring(0, 4); // AAAB (bank code + currency)
    const checkDigit = line.substring(32, 33); // K (general check digit)
    const dueFactor = line.substring(33, 37); // UUUU
    const amount = line.substring(37, 47); // VVVVVVVVVV

    // Free field from the 3 groups (removing per-field check digits at positions 9, 20, 31)
    const field1 = line.substring(4, 9); // 5 chars from group 1
    const field2 = line.substring(10, 20); // 10 chars from group 2
    const field3 = line.substring(21, 31); // 10 chars from group 3

    return (
      bankAndCurrency +
      checkDigit +
      dueFactor +
      amount +
      field1 +
      field2 +
      field3
    );
  }

  // Convert 44-digit barcode to 47-digit line
  private static barcodeToDigitLine(barcode: string): string {
    const bankAndCurrency = barcode.substring(0, 4);
    const freeField = barcode.substring(19, 44);

    // Group 1: bank+currency + first 5 of free field
    const group1Data = bankAndCurrency + freeField.substring(0, 5);
    const group1Check = BoletoBarcode.mod10(group1Data);

    // Group 2: next 10 of free field
    const group2Data = freeField.substring(5, 15);
    const group2Check = BoletoBarcode.mod10(group2Data);

    // Group 3: last 10 of free field
    const group3Data = freeField.substring(15, 25);
    const group3Check = BoletoBarcode.mod10(group3Data);

    const checkDigit = barcode.substring(4, 5);
    const dueFactor = barcode.substring(5, 9);
    const amount = barcode.substring(9, 19);

    return (
      group1Data +
      group1Check +
      group2Data +
      group2Check +
      group3Data +
      group3Check +
      checkDigit +
      dueFactor +
      amount
    );
  }

  private static mod10(data: string): string {
    const digits = data.split('').map(Number);
    let weight = 2;
    let sum = 0;

    for (let i = digits.length - 1; i >= 0; i--) {
      let result = digits[i] * weight;
      if (result > 9) result = Math.floor(result / 10) + (result % 10);
      sum += result;
      weight = weight === 2 ? 1 : 2;
    }

    const remainder = sum % 10;
    return remainder === 0 ? '0' : String(10 - remainder);
  }
}
