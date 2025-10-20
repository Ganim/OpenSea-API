/**
 * Gera um CPF válido (Cadastro de Pessoa Física)
 * Baseado no algoritmo oficial de validação de CPF
 */
export class CPFGenerator {
  /**
   * Gera um dígito verificador do CPF
   */
  private static calculateDigit(cpf: string, factor: number): number {
    let sum = 0;
    for (let i = 0; i < cpf.length; i++) {
      sum += parseInt(cpf.charAt(i)) * factor;
      factor--;
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  }

  /**
   * Gera um CPF válido aleatório
   * @returns CPF sem formatação (11 dígitos)
   */
  static generate(): string {
    // Gera os primeiros 9 dígitos aleatórios
    const base = Array.from({ length: 9 }, () =>
      Math.floor(Math.random() * 10),
    ).join('');

    // Calcula os dígitos verificadores
    const digit1 = this.calculateDigit(base, 10);
    const digit2 = this.calculateDigit(base + digit1, 11);

    return base + digit1 + digit2;
  }

  /**
   * Gera um CPF válido formatado
   * @returns CPF formatado (XXX.XXX.XXX-XX)
   */
  static generateFormatted(): string {
    const cpf = this.generate();
    return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }

  /**
   * Gera um CPF único baseado em timestamp
   * Útil para testes que precisam de CPFs únicos em cada execução
   * @returns CPF sem formatação (11 dígitos)
   */
  static generateUnique(): string {
    const timestamp = Date.now().toString();
    // Usa os últimos 7 dígitos do timestamp + 2 dígitos aleatórios
    const base =
      timestamp.slice(-7) +
      Array.from({ length: 2 }, () => Math.floor(Math.random() * 10)).join('');

    // Calcula os dígitos verificadores
    const digit1 = this.calculateDigit(base, 10);
    const digit2 = this.calculateDigit(base + digit1, 11);

    return base + digit1 + digit2;
  }

  /**
   * Formata um CPF
   * @param cpf CPF sem formatação (11 dígitos)
   * @returns CPF formatado (XXX.XXX.XXX-XX)
   */
  static format(cpf: string): string {
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length !== 11) {
      throw new Error('CPF must have 11 digits');
    }
    return cleaned.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }

  /**
   * Remove a formatação de um CPF
   * @param cpf CPF formatado ou não
   * @returns CPF sem formatação (11 dígitos)
   */
  static unformat(cpf: string): string {
    return cpf.replace(/\D/g, '');
  }
}
