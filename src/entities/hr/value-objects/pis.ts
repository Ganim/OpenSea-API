import { ValueObject } from './cpf';

export class PIS extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  static create(pis: string): PIS {
    if (!this.isValid(pis)) {
      throw new Error('PIS inválido');
    }

    // Remove formatação e mantém apenas números
    const cleanPIS = pis.replace(/\D/g, '');

    return new PIS(cleanPIS);
  }

  static isValid(pis: string): boolean {
    if (!pis) return false;

    // Remove formatação
    const cleanPIS = pis.replace(/\D/g, '');

    // Verifica se tem 11 dígitos
    if (cleanPIS.length !== 11) return false;

    // Verifica se todos os dígitos são iguais (PIS inválido)
    if (/^(\d)\1+$/.test(cleanPIS)) return false;

    // Calcula dígito verificador usando pesos específicos do PIS
    const weights = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;

    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanPIS.charAt(i)) * weights[i];
    }

    const remainder = sum % 11;
    const checkDigit = remainder < 2 ? 0 : 11 - remainder;

    if (checkDigit !== parseInt(cleanPIS.charAt(10))) return false;

    return true;
  }

  get value(): string {
    return this._value;
  }

  get formatted(): string {
    // Formata como XXX.XXXXX.XX-X
    return this._value.replace(/(\d{3})(\d{5})(\d{2})(\d{1})/, '$1.$2.$3-$4');
  }

  equals(other: ValueObject<string>): boolean {
    if (!(other instanceof PIS)) return false;
    return super.equals(other);
  }
}
