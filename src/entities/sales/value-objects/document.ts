export class Document {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(value: string): Document {
    if (!value || value.trim().length === 0) {
      throw new Error('Document cannot be empty');
    }

    // Remove caracteres não numéricos
    const cleanedValue = value.replace(/\D/g, '');

    // Valida CPF (11 dígitos) ou CNPJ (14 dígitos)
    if (cleanedValue.length !== 11 && cleanedValue.length !== 14) {
      throw new Error(
        'Document must be a valid CPF (11 digits) or CNPJ (14 digits)',
      );
    }

    // Validação básica de CPF
    if (cleanedValue.length === 11) {
      if (!this.isValidCPF(cleanedValue)) {
        throw new Error('Invalid CPF');
      }
    }

    // Validação básica de CNPJ
    if (cleanedValue.length === 14) {
      if (!this.isValidCNPJ(cleanedValue)) {
        throw new Error('Invalid CNPJ');
      }
    }

    return new Document(cleanedValue);
  }

  private static isValidCPF(cpf: string): boolean {
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) {
      return false;
    }

    // Validação dos dígitos verificadores
    let sum = 0;
    let remainder;

    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(9, 10))) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(10, 11))) return false;

    return true;
  }

  private static isValidCNPJ(cnpj: string): boolean {
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(cnpj)) {
      return false;
    }

    // Validação do primeiro dígito verificador
    let length = cnpj.length - 2;
    let numbers = cnpj.substring(0, length);
    const digits = cnpj.substring(length);
    let sum = 0;
    let pos = length - 7;

    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;

    // Validação do segundo dígito verificador
    length = length + 1;
    numbers = cnpj.substring(0, length);
    sum = 0;
    pos = length - 7;

    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) return false;

    return true;
  }

  get value(): string {
    return this._value;
  }

  get formatted(): string {
    if (this._value.length === 11) {
      // Formata CPF: 000.000.000-00
      return this._value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    // Formata CNPJ: 00.000.000/0000-00
    return this._value.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      '$1.$2.$3/$4-$5',
    );
  }

  get isCPF(): boolean {
    return this._value.length === 11;
  }

  get isCNPJ(): boolean {
    return this._value.length === 14;
  }

  toString(): string {
    return this._value;
  }

  equals(other: Document): boolean {
    return this._value === other._value;
  }
}
