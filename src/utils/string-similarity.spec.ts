import { describe, expect, it } from 'vitest';
import {
  calculateStringSimilarity,
  levenshteinDistance,
  normalizeString,
} from './string-similarity';

describe('normalizeString', () => {
  it('should convert to lowercase', () => {
    expect(normalizeString('HELLO WORLD')).toBe('hello world');
  });

  it('should remove accents from Portuguese characters', () => {
    expect(normalizeString('São Paulo')).toBe('sao paulo');
    expect(normalizeString('João')).toBe('joao');
    expect(normalizeString('Açúcar')).toBe('acucar');
    expect(normalizeString('Café')).toBe('cafe');
    expect(normalizeString('Ação')).toBe('acao');
  });

  it('should remove special characters', () => {
    expect(normalizeString('PIX - ENVIADO #123')).toBe('pix enviado 123');
    expect(normalizeString('R$ 1.500,00')).toBe('r 150000');
  });

  it('should collapse multiple spaces', () => {
    expect(normalizeString('hello    world')).toBe('hello world');
    expect(normalizeString('  trim  me  ')).toBe('trim me');
  });

  it('should handle empty string', () => {
    expect(normalizeString('')).toBe('');
  });
});

describe('levenshteinDistance', () => {
  it('should return 0 for identical strings', () => {
    expect(levenshteinDistance('abc', 'abc')).toBe(0);
  });

  it('should return length of other string when one is empty', () => {
    expect(levenshteinDistance('', 'abc')).toBe(3);
    expect(levenshteinDistance('abc', '')).toBe(3);
  });

  it('should return 0 for two empty strings', () => {
    expect(levenshteinDistance('', '')).toBe(0);
  });

  it('should calculate single character substitution', () => {
    expect(levenshteinDistance('cat', 'bat')).toBe(1);
  });

  it('should calculate single character insertion', () => {
    expect(levenshteinDistance('cat', 'cats')).toBe(1);
  });

  it('should calculate single character deletion', () => {
    expect(levenshteinDistance('cats', 'cat')).toBe(1);
  });

  it('should handle completely different strings', () => {
    expect(levenshteinDistance('abc', 'xyz')).toBe(3);
  });

  it('should handle real-world supplier names', () => {
    // Common typos or slight variations
    expect(levenshteinDistance('fornecedor abc', 'fornecedor abc ltda')).toBe(
      5,
    );
    expect(levenshteinDistance('pix enviado', 'pix recebido')).toBe(5);
  });
});

describe('calculateStringSimilarity', () => {
  it('should return 1 for identical strings', () => {
    expect(calculateStringSimilarity('hello', 'hello')).toBe(1);
  });

  it('should return 0 for empty vs non-empty', () => {
    expect(calculateStringSimilarity('', 'hello')).toBe(0);
    expect(calculateStringSimilarity('hello', '')).toBe(0);
  });

  it('should return high similarity for close strings', () => {
    const similarity = calculateStringSimilarity(
      'fornecedor abc',
      'fornecedor abcd',
    );
    expect(similarity).toBeGreaterThan(0.9);
  });

  it('should return low similarity for very different strings', () => {
    const similarity = calculateStringSimilarity(
      'pagamento aluguel',
      'venda produto xyz',
    );
    expect(similarity).toBeLessThan(0.4);
  });

  it('should work well with normalized Brazilian business descriptions', () => {
    const descriptionA = normalizeString('PIX ENVIADO - Fornecedor ABC LTDA');
    const descriptionB = normalizeString('Fornecedor ABC');

    const similarity = calculateStringSimilarity(descriptionA, descriptionB);
    expect(similarity).toBeGreaterThan(0.4); // Partial match
  });

  it('should handle both strings being empty', () => {
    expect(calculateStringSimilarity('', '')).toBe(0);
  });
});
