import { describe, expect, it } from 'vitest';
import { crc16Kermit, crc16KermitHex } from './crc16-kermit';

describe('crc16Kermit', () => {
  it('matches the official Portaria MTP 671/2021 Anexo I §8 golden ("123456789" → 0x2189)', () => {
    // Golden oficial — qualquer bug silencioso na implementação da CRC-16/KERMIT
    // resulta em AFD rejeitado pelo validador MTP. Este teste é a sentinela.
    const result = crc16Kermit(Buffer.from('123456789', 'latin1'));
    expect(result).toBe(0x2189);
  });

  it('returns 0x0000 for an empty buffer (initial value)', () => {
    expect(crc16Kermit(Buffer.alloc(0))).toBe(0x0000);
  });

  it('produces a stable value for a single ASCII byte', () => {
    // Valor fixo computado pela própria implementação — serve como
    // regression test (qualquer mudança no algoritmo quebra esta linha).
    const result = crc16Kermit(Buffer.from('A', 'latin1'));
    // 'A' = 0x41 → CRC-16/KERMIT(0x41) computado pela referência: 0x538D
    expect(result).toBe(0x538d);
  });

  it('handles Latin-1 characters (acentuados) sem erro', () => {
    // "PANIFICADORA JOÃO LTDA" exercita pelo menos um byte > 127 (Ã = 0xC3 em UTF-8
    // mas 0xC3 = Ã em Latin-1 também). Garante que o loop não estoura.
    const result = crc16Kermit(Buffer.from('PANIFICADORA JOÃO LTDA', 'latin1'));
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThan(0x10000);
  });

  it('always returns a 16-bit unsigned integer (property test)', () => {
    const samples = [
      '',
      'a',
      'AB',
      'The quick brown fox jumps over the lazy dog',
      '1'.repeat(1024),
      'PANIFICADORA JOÃO & CIA LTDA',
      String.fromCharCode(0, 1, 2, 3, 254, 255),
    ];
    for (const s of samples) {
      const result = crc16Kermit(Buffer.from(s, 'latin1'));
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(0x10000);
    }
  });
});

describe('crc16KermitHex', () => {
  it('returns "2189" for the golden Portaria input', () => {
    expect(crc16KermitHex(Buffer.from('123456789', 'latin1'))).toBe('2189');
  });

  it('returns "0000" for an empty buffer', () => {
    expect(crc16KermitHex(Buffer.alloc(0))).toBe('0000');
  });

  it('always returns 4 uppercase hex chars', () => {
    const samples = ['', 'A', 'foo', 'bar baz', 'PANIFICADORA JOÃO & CIA LTDA'];
    for (const s of samples) {
      const hex = crc16KermitHex(Buffer.from(s, 'latin1'));
      expect(hex).toMatch(/^[0-9A-F]{4}$/);
    }
  });
});
