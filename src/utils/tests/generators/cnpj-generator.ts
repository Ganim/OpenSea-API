/**
 * Gera um CNPJ válido (Cadastro Nacional de Pessoa Jurídica)
 * Baseado no algoritmo oficial de validação de CNPJ
 */
export class CNPJGenerator {
  /**
   * Calculates a CNPJ check digit
   * @param numbers - The base numbers to calculate the digit from
   * @param startPos - Starting position for the weight calculation
   * @returns The calculated check digit
   */
  private static calculateDigit(numbers: string, startPos: number): number {
    let sum = 0;
    let pos = startPos;

    for (let i = 0; i < numbers.length; i++) {
      sum += Number.parseInt(numbers.charAt(i)) * pos--;
      if (pos < 2) pos = 9;
    }

    const result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return result;
  }

  /**
   * Gera um CNPJ válido aleatório
   * @returns CNPJ sem formatação (14 dígitos)
   */
  static generate(): string {
    // Gera os primeiros 12 dígitos aleatórios
    const base = Array.from({ length: 12 }, () =>
      Math.floor(Math.random() * 10),
    ).join('');

    // Calcula os dígitos verificadores
    const digit1 = this.calculateDigit(base, 5);
    const digit2 = this.calculateDigit(base + digit1, 6);

    return base + digit1 + digit2;
  }

  /**
   * Gera um CNPJ válido formatado
   * @returns CNPJ formatado (XX.XXX.XXX/XXXX-XX)
   */
  static generateFormatted(): string {
    const cnpj = this.generate();
    return cnpj.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      '$1.$2.$3/$4-$5',
    );
  }

  /**
   * Gera um CNPJ único baseado em timestamp
   * Útil para testes que precisam de CNPJs únicos em cada execução
   * @returns CNPJ sem formatação (14 dígitos)
   */
  static generateUnique(): string {
    const timestamp = Date.now().toString();
    // Usa os últimos 8 dígitos do timestamp + 4 dígitos aleatórios
    const base =
      timestamp.slice(-8) +
      Array.from({ length: 4 }, () => Math.floor(Math.random() * 10)).join('');

    // Calcula os dígitos verificadores
    const digit1 = this.calculateDigit(base, 5);
    const digit2 = this.calculateDigit(base + digit1, 6);

    return base + digit1 + digit2;
  }

  /**
   * Formata um CNPJ
   * @param cnpj CNPJ sem formatação (14 dígitos)
   * @returns CNPJ formatado (XX.XXX.XXX/XXXX-XX)
   */
  static format(cnpj: string): string {
    const cleaned = cnpj.replace(/\D/g, '');
    if (cleaned.length !== 14) {
      throw new Error('CNPJ must have 14 digits');
    }
    return cleaned.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      '$1.$2.$3/$4-$5',
    );
  }

  /**
   * Remove a formatação de um CNPJ
   * @param cnpj CNPJ formatado ou não
   * @returns CNPJ sem formatação (14 dígitos)
   */
  static unformat(cnpj: string): string {
    return cnpj.replace(/\D/g, '');
  }
}
