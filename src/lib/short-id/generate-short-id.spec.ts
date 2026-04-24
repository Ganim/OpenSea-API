import { describe, expect, it } from 'vitest';
import { CROCKFORD_ALPHABET, generateShortId } from './generate-short-id';

describe('generateShortId', () => {
  it('gera código com tamanho padrão 6', () => {
    const id = generateShortId();
    expect(id).toHaveLength(6);
  });

  it('gera código apenas com caracteres do alfabeto Crockford-like', () => {
    for (let i = 0; i < 1000; i++) {
      const id = generateShortId();
      for (const char of id) {
        expect(CROCKFORD_ALPHABET).toContain(char);
      }
    }
  });

  it('não inclui caracteres ambíguos (0, O, 1, I, L, Q, G, U, V)', () => {
    const forbidden = ['0', 'O', '1', 'I', 'L', 'Q', 'G', 'U', 'V'];
    for (let i = 0; i < 1000; i++) {
      const id = generateShortId();
      for (const char of forbidden) {
        expect(id).not.toContain(char);
      }
    }
  });

  it('aceita tamanho customizado', () => {
    expect(generateShortId({ length: 4 })).toHaveLength(4);
    expect(generateShortId({ length: 8 })).toHaveLength(8);
  });

  it('gera códigos distintos com alta probabilidade', () => {
    const set = new Set<string>();
    for (let i = 0; i < 10000; i++) {
      set.add(generateShortId());
    }
    // Com 6 chars e 27 do alfabeto (~387M combinações), 10k amostras
    // devem ser praticamente todas únicas.
    expect(set.size).toBeGreaterThan(9990);
  });
});
