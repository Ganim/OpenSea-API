import { describe, expect, it } from 'vitest';
import { PixCode } from './pix-code';

describe('PixCode', () => {
  describe('parse', () => {
    it('should detect Copia e Cola input and extract merchant name', () => {
      // Use a valid EMV QR string starting with 000201
      const input =
        '00020126580014br.gov.bcb.pix0136a1b2c3d4-e5f6-7890-abcd-ef1234567890520400005303986540510.005802BR5913EMPRESA TESTE6008BRASILIA62070503***6304ABCD';
      const result = PixCode.parse(input);
      expect(result).not.toBeNull();
      expect(result!.type).toBe('COPIA_COLA');
      expect(result!.merchantName).toBe('EMPRESA TESTE');
      expect(result!.amount).toBe(10.0);
    });

    it('should detect CPF key (11 digits)', () => {
      const result = PixCode.parse('12345678901');
      expect(result!.type).toBe('CHAVE');
      expect(result!.pixKeyType).toBe('CPF');
    });

    it('should detect CNPJ key (14 digits)', () => {
      const result = PixCode.parse('12345678000190');
      expect(result!.type).toBe('CHAVE');
      expect(result!.pixKeyType).toBe('CNPJ');
    });

    it('should detect email key', () => {
      const result = PixCode.parse('test@example.com');
      expect(result!.type).toBe('CHAVE');
      expect(result!.pixKeyType).toBe('EMAIL');
    });

    it('should detect phone key', () => {
      const result = PixCode.parse('+5511999998888');
      expect(result!.type).toBe('CHAVE');
      expect(result!.pixKeyType).toBe('PHONE');
    });

    it('should detect EVP (UUID) key', () => {
      const result = PixCode.parse('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
      expect(result!.type).toBe('CHAVE');
      expect(result!.pixKeyType).toBe('EVP');
    });

    it('should return null for empty input', () => {
      expect(PixCode.parse('')).toBeNull();
      expect(PixCode.parse('   ')).toBeNull();
    });
  });

  describe('detectKeyType', () => {
    it('should detect CPF with formatting', () => {
      expect(PixCode.detectKeyType('123.456.789-01')).toBe('CPF');
    });

    it('should detect CNPJ with formatting', () => {
      expect(PixCode.detectKeyType('12.345.678/0001-90')).toBe('CNPJ');
    });

    it('should detect phone with +55 prefix', () => {
      expect(PixCode.detectKeyType('+5511999998888')).toBe('PHONE');
    });

    it('should detect phone with 10 digits (landline)', () => {
      expect(PixCode.detectKeyType('1133334444')).toBe('PHONE');
    });

    it('should detect phone with 13 digits', () => {
      expect(PixCode.detectKeyType('5511999998888')).toBe('PHONE');
    });

    it('should fallback to EVP for unknown patterns', () => {
      expect(PixCode.detectKeyType('random-key-value')).toBe('EVP');
    });
  });

  describe('parseCopiaECola edge cases', () => {
    it('should extract merchant city', () => {
      const input =
        '00020126580014br.gov.bcb.pix0136a1b2c3d4-e5f6-7890-abcd-ef1234567890520400005303986540510.005802BR5913EMPRESA TESTE6008BRASILIA62070503***6304ABCD';
      const result = PixCode.parse(input);
      expect(result!.merchantCity).toBe('BRASILIA');
    });

    it('should handle Copia e Cola without amount', () => {
      // Build a minimal EMV payload without tag 54
      const input =
        '00020126580014br.gov.bcb.pix0136a1b2c3d4-e5f6-7890-abcd-ef12345678905204000053039865802BR5913EMPRESA TESTE6008BRASILIA62070503***6304ABCD';
      const result = PixCode.parse(input);
      expect(result).not.toBeNull();
      expect(result!.type).toBe('COPIA_COLA');
      expect(result!.amount).toBeUndefined();
    });

    it('should extract the pix key from Copia e Cola', () => {
      const input =
        '00020126580014br.gov.bcb.pix0136a1b2c3d4-e5f6-7890-abcd-ef1234567890520400005303986540510.005802BR5913EMPRESA TESTE6008BRASILIA62070503***6304ABCD';
      const result = PixCode.parse(input);
      expect(result!.pixKey).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
      expect(result!.pixKeyType).toBe('EVP');
    });
  });

  describe('buildEmv', () => {
    it('should build a dynamic EMV payload with amount and parse back successfully', () => {
      const emv = PixCode.buildEmv({
        pixKey: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        merchantName: 'Empresa Teste',
        merchantCity: 'Sao Paulo',
        amount: 99.9,
        txId: 'INV001',
      });

      expect(emv).not.toBeNull();
      expect(emv!.startsWith('000201')).toBe(true);
      expect(emv!.includes('br.gov.bcb.pix')).toBe(true);
      expect(emv!.includes('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe(true);

      const parsed = PixCode.parse(emv!);
      expect(parsed).not.toBeNull();
      expect(parsed!.type).toBe('COPIA_COLA');
      expect(parsed!.amount).toBe(99.9);
      expect(parsed!.pixKey).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
    });

    it('should build a static EMV payload when no amount is provided', () => {
      const emv = PixCode.buildEmv({
        pixKey: '12345678901',
        merchantName: 'Jose da Silva',
        merchantCity: 'Rio',
      });

      expect(emv).not.toBeNull();
      // POI Method 11 for static
      expect(emv!.substring(6, 12)).toBe('010211');

      const parsed = PixCode.parse(emv!);
      expect(parsed!.amount).toBeUndefined();
      expect(parsed!.pixKey).toBe('12345678901');
    });

    it('should produce deterministic output (same input -> same CRC)', () => {
      const input = {
        pixKey: 'test@example.com',
        merchantName: 'Loja XYZ',
        merchantCity: 'Curitiba',
        amount: 10,
        txId: 'TX1',
      };
      expect(PixCode.buildEmv(input)).toBe(PixCode.buildEmv(input));
    });

    it('should return null for empty pix key', () => {
      expect(
        PixCode.buildEmv({
          pixKey: '',
          merchantName: 'X',
          merchantCity: 'Y',
        }),
      ).toBeNull();
    });

    it('should end with a 4-char CRC after the 6304 tag', () => {
      const emv = PixCode.buildEmv({
        pixKey: '12345678901',
        merchantName: 'Teste',
        merchantCity: 'SP',
      });
      expect(emv!.slice(-8, -4)).toBe('6304');
      expect(emv!.slice(-4)).toMatch(/^[0-9A-F]{4}$/);
    });
  });
});
