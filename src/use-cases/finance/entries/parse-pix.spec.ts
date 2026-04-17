import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { beforeEach, describe, expect, it } from 'vitest';
import { ParsePixUseCase } from './parse-pix';

let sut: ParsePixUseCase;

describe('ParsePixUseCase', () => {
  beforeEach(() => {
    sut = new ParsePixUseCase();
  });

  it('should parse a valid PIX CPF key', async () => {
    const result = await sut.execute({ code: '12345678901' });

    expect(result.pix.type).toBe('CHAVE');
    expect(result.pix.pixKey).toBe('12345678901');
    expect(result.pix.pixKeyType).toBe('CPF');
  });

  it('should parse a valid PIX CNPJ key', async () => {
    const result = await sut.execute({ code: '12345678000195' });

    expect(result.pix.type).toBe('CHAVE');
    expect(result.pix.pixKey).toBe('12345678000195');
    expect(result.pix.pixKeyType).toBe('CNPJ');
  });

  it('should parse a valid PIX email key', async () => {
    const result = await sut.execute({ code: 'teste@exemplo.com' });

    expect(result.pix.type).toBe('CHAVE');
    expect(result.pix.pixKey).toBe('teste@exemplo.com');
    expect(result.pix.pixKeyType).toBe('EMAIL');
  });

  it('should parse a valid PIX phone key', async () => {
    const result = await sut.execute({ code: '+5511987654321' });

    expect(result.pix.type).toBe('CHAVE');
    expect(result.pix.pixKey).toBe('+5511987654321');
    expect(result.pix.pixKeyType).toBe('PHONE');
  });

  it('should parse a valid PIX EVP (UUID) key', async () => {
    const uuid = '123e4567-e89b-12d3-a456-426614174000';
    const result = await sut.execute({ code: uuid });

    expect(result.pix.type).toBe('CHAVE');
    expect(result.pix.pixKey).toBe(uuid);
    expect(result.pix.pixKeyType).toBe('EVP');
  });

  it('should parse a valid copia-e-cola PIX code (CRC matches)', async () => {
    // Minimal valid EMV payload (BCB Pix §4.x). CRC `7596` was computed with
    // CRC16-CCITT over everything up to and including the `6304` marker so
    // the parser accepts it under the P3-34 CRC-verification guard.
    const copiaECola =
      '00020126580014br.gov.bcb.pix013636401fa8-b9c9-4d05-b43e-2aef6a22480552040000530398654071500.005802BR5913Joao da Silva6008Sao Paulo63047596';

    const result = await sut.execute({ code: copiaECola });

    expect(result.pix.type).toBe('COPIA_COLA');
  });

  // P3-34: CRC validation — the parser used to accept any TLV-parseable
  // payload, which let tampered or corrupted codes flow into reconciliation.
  it('should reject a copia-e-cola payload whose CRC does not match (P3-34)', async () => {
    // Same payload as above but with a deliberately wrong CRC (E2CA != 7596).
    const tampered =
      '00020126580014br.gov.bcb.pix013636401fa8-b9c9-4d05-b43e-2aef6a22480552040000530398654071500.005802BR5913Joao da Silva6008Sao Paulo6304E2CA';

    await expect(sut.execute({ code: tampered })).rejects.toThrow(
      BadRequestError,
    );
  });

  it('should reject a copia-e-cola payload missing the CRC trailer (P3-34)', async () => {
    const truncated =
      '00020126580014br.gov.bcb.pix013636401fa8-b9c9-4d05-b43e-2aef6a22480552040000530398654071500.005802BR5913Joao da Silva6008Sao Paulo';

    await expect(sut.execute({ code: truncated })).rejects.toThrow(
      BadRequestError,
    );
  });

  it('should accept a CRC written in lowercase hex (case-insensitive, P3-34)', async () => {
    // Only the CRC trailer is lowercased — the rest of the payload must stay
    // byte-identical, otherwise the CRC would change.
    const code =
      '00020126580014br.gov.bcb.pix013636401fa8-b9c9-4d05-b43e-2aef6a22480552040000530398654071500.005802BR5913Joao da Silva6008Sao Paulo63047596'.replace(
        /7596$/,
        '7596'.toLowerCase(),
      );

    const result = await sut.execute({ code });

    expect(result.pix.type).toBe('COPIA_COLA');
  });

  it('should throw BadRequestError for empty code', async () => {
    await expect(sut.execute({ code: '' })).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError for whitespace-only code', async () => {
    await expect(sut.execute({ code: '   ' })).rejects.toThrow(BadRequestError);
  });
});
