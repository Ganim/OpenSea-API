export abstract class ValueObject<T> {
  protected _value: T;

  constructor(value: T) {
    this._value = value;
  }

  equals(other: ValueObject<T>): boolean {
    return this._value === other._value;
  }
}

export class CPF extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  static create(cpf: string): CPF {
    if (!this.isValid(cpf)) {
      throw new Error('CPF inválido');
    }

    // Remove formatação e mantém apenas números
    const cleanCPF = cpf.replace(/\D/g, '');

    return new CPF(cleanCPF);
  }

  static isValid(cpf: string): boolean {
    if (!cpf) return false;

    // Remove formatação
    const cleanCPF = cpf.replace(/\D/g, '');

    // Verifica se tem 11 dígitos
    if (cleanCPF.length !== 11) return false;

    // Verifica se todos os dígitos são iguais (CPF inválido)
    if (/^(\d)\1+$/.test(cleanCPF)) return false;

    // Calcula primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(9))) return false;

    // Calcula segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(10))) return false;

    return true;
  }

  get value(): string {
    return this._value;
  }

  get formatted(): string {
    // Formata como XXX.XXX.XXX-XX
    return this._value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  equals(other: ValueObject<string>): boolean {
    if (!(other instanceof CPF)) return false;
    return super.equals(other);
  }
}
