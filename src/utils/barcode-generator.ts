/**
 * Gera códigos de barras baseados no fullCode hierárquico
 *
 * Formato dos códigos:
 * - Barcode (Code128): Usa o fullCode completo (até 30 caracteres)
 * - EAN-13: Gera 13 dígitos a partir do hash do fullCode
 * - UPC: Gera 12 dígitos a partir do hash do fullCode
 */

/**
 * Calcula dígito verificador EAN-13
 */
function calculateEAN13CheckDigit(digits: string): string {
  const sum = digits
    .split('')
    .map(Number)
    .reduce((acc, digit, index) => {
      // Posições ímpares (contando do final) multiplicam por 3
      const weight = index % 2 === 0 ? 1 : 3;
      return acc + digit * weight;
    }, 0);

  const remainder = sum % 10;
  return remainder === 0 ? '0' : String(10 - remainder);
}

/**
 * Calcula dígito verificador UPC
 */
function calculateUPCCheckDigit(digits: string): string {
  const sum = digits
    .split('')
    .map(Number)
    .reduce((acc, digit, index) => {
      // Posições ímpares (da esquerda, índice 0) multiplicam por 3
      const weight = index % 2 === 0 ? 3 : 1;
      return acc + digit * weight;
    }, 0);

  const remainder = sum % 10;
  return remainder === 0 ? '0' : String(10 - remainder);
}

/**
 * Gera um hash numérico simples de uma string
 */
function hashToDigits(text: string, length: number): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Converte para string numérica positiva
  const positive = Math.abs(hash);
  const digits = String(positive).padStart(length, '0').slice(0, length);

  return digits;
}

/**
 * Gera código de barras Code128 a partir do fullCode
 * Code128 suporta caracteres alfanuméricos completos
 */
export function generateBarcode(fullCode: string): string {
  // Code128 pode usar o fullCode diretamente
  // Remove apenas caracteres que não sejam alfanuméricos, pontos, hífens
  return fullCode.replace(/[^A-Za-z0-9.-]/g, '');
}

/**
 * Gera código EAN-13 a partir do fullCode
 * Formato: 13 dígitos numéricos
 */
export function generateEAN13(fullCode: string): string {
  // Gera 12 dígitos base a partir do hash do fullCode
  const baseDigits = hashToDigits(fullCode, 12);

  // Calcula dígito verificador
  const checkDigit = calculateEAN13CheckDigit(baseDigits);

  return baseDigits + checkDigit;
}

/**
 * Gera código UPC a partir do fullCode
 * Formato: 12 dígitos numéricos
 */
export function generateUPC(fullCode: string): string {
  // Gera 11 dígitos base a partir do hash do fullCode
  const baseDigits = hashToDigits(fullCode, 11);

  // Calcula dígito verificador
  const checkDigit = calculateUPCCheckDigit(baseDigits);

  return baseDigits + checkDigit;
}

/**
 * Valida código EAN-13
 */
export function validateEAN13(ean: string): boolean {
  if (!/^\d{13}$/.test(ean)) {
    return false;
  }

  const checkDigit = ean[12];
  const calculatedCheckDigit = calculateEAN13CheckDigit(ean.slice(0, 12));

  return checkDigit === calculatedCheckDigit;
}

/**
 * Valida código UPC
 */
export function validateUPC(upc: string): boolean {
  if (!/^\d{12}$/.test(upc)) {
    return false;
  }

  const checkDigit = upc[11];
  const calculatedCheckDigit = calculateUPCCheckDigit(upc.slice(0, 11));

  return checkDigit === calculatedCheckDigit;
}
