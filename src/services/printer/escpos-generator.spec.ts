import { describe, expect, it } from 'vitest';
import { ESCPOSGenerator } from './escpos-generator';

describe('ESCPOSGenerator', () => {
  it('should generate init and cut commands', () => {
    const generator = new ESCPOSGenerator();
    const hex = generator.init().cutPaper().toHex();

    expect(hex).toContain('1b40');
    expect(hex).toContain('1d5600');
  });

  it('should wrap long text for 58mm paper', () => {
    const generator = new ESCPOSGenerator({ paperWidth: 58 });

    generator.left(
      'Este e um texto muito longo para validar a quebra inteligente por largura de papel termico.',
    );

    const payload = Buffer.from(generator.toBytes()).toString('utf-8');

    expect(payload).toContain('Este e um texto muito longo para');
    expect(payload).toContain('validar a quebra inteligente por');
  });

  it('should generate qr code and barcode commands', () => {
    const generator = new ESCPOSGenerator();

    const hex = generator
      .init()
      .qrCode('ORDER-123', 6)
      .barCode('7891234567890', 'EAN13')
      .toHex();

    expect(hex).toContain('1d286b');
    expect(hex).toContain('1d6b43');
  });

  it('should export output to base64', () => {
    const generator = new ESCPOSGenerator();

    const base64 = generator.init().left('hello').toBase64();

    expect(base64.length).toBeGreaterThan(0);
  });
});
