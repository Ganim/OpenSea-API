/**
 * Gera códigos únicos para testes E2E
 * Combina timestamp com números aleatórios para garantir unicidade mesmo em execução paralela
 */

export function generateProductFullCode(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  
  // Formato: 001.XXX.YYYYY (máx 20 caracteres)
  // XXX = últimos 3 dígitos do timestamp
  // YYYYY = 4 dígitos do timestamp + 1 dígito random
  const part1 = '001';
  const part2 = String(timestamp).slice(-3).padStart(3, '0');
  const part3 = `${String(timestamp).slice(-4)}${String(random).slice(0, 1)}`;
  
  return `${part1}.${part2}.${part3}`;
}

export function generateVariantFullCode(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000); // Aumentado para 10000
  
  // Formato: 001.XXX.YYYYY.ZZZ (máx 20 caracteres)
  // Usando mais bits do random para evitar colisões
  const part1 = '001';
  const part2 = String(timestamp).slice(-3).padStart(3, '0');
  const part3 = String(timestamp).slice(-4);
  const part4 = String(random).padStart(4, '0').slice(0, 3); // Pega 3 dígitos do random
  
  return `${part1}.${part2}.${part3}.${part4}`;
}

export function generateManufacturerCode(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  
  // Formato: XXX (3 caracteres)
  return `${String(timestamp).slice(-2)}${String(random).slice(0, 1)}`;
}
