import { randomInt } from 'node:crypto';

/**
 * Alfabeto Crockford-like — 27 caracteres, sem ambíguos visuais.
 * Exclui dígitos 0/1 (confundem com O/I/L) e letras G/I/L/O/Q/U/V
 * (confundem com 6/1/0 ou entre si). Resulta em 8 dígitos + 19 letras = 27.
 * Espaço combinatório para 6 chars: ~387M. Suficiente para qualquer tenant realista.
 */
export const CROCKFORD_ALPHABET = '23456789ABCDEFHJKMNPRSTWXYZ';

export interface GenerateShortIdOptions {
  length?: number;
}

export function generateShortId(options: GenerateShortIdOptions = {}): string {
  const length = options.length ?? 6;
  const alphabetLen = CROCKFORD_ALPHABET.length;
  let result = '';
  for (let i = 0; i < length; i++) {
    result += CROCKFORD_ALPHABET[randomInt(0, alphabetLen)];
  }
  return result;
}
