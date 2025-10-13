export class CNPJ {
  private readonly value: string;

  private constructor(cnpj: string) {
    this.value = cnpj;
  }

  static create(cnpj: string): CNPJ | null {
    const cleanedCNPJ = cnpj.replace(/[^\d]/g, '');

    if (cleanedCNPJ.length !== 14) {
      return null;
    }

    if (!CNPJ.isValid(cleanedCNPJ)) {
      return null;
    }

    return new CNPJ(CNPJ.format(cleanedCNPJ));
  }

  private static isValid(cnpj: string): boolean {
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(cnpj)) {
      return false;
    }

    // Validação dos dígitos verificadores
    let size = cnpj.length - 2;
    let numbers = cnpj.substring(0, size);
    const digits = cnpj.substring(size);
    let sum = 0;
    let pos = size - 7;

    for (let i = size; i >= 1; i--) {
      sum += Number.parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== Number.parseInt(digits.charAt(0))) {
      return false;
    }

    size = size + 1;
    numbers = cnpj.substring(0, size);
    sum = 0;
    pos = size - 7;

    for (let i = size; i >= 1; i--) {
      sum += Number.parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== Number.parseInt(digits.charAt(1))) {
      return false;
    }

    return true;
  }

  private static format(cnpj: string): string {
    return cnpj.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      '$1.$2.$3/$4-$5',
    );
  }

  get formatted(): string {
    return this.value;
  }

  get unformatted(): string {
    return this.value.replace(/[^\d]/g, '');
  }

  equals(other: CNPJ): boolean {
    return this.unformatted === other.unformatted;
  }

  toString(): string {
    return this.value;
  }
}
