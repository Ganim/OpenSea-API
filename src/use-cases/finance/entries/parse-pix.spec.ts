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

  it('should parse a valid copia-e-cola PIX code', async () => {
    // A simplified valid EMV payload starting with 000201
    // Tag 59 = Merchant Name, tag 60 = Merchant City
    // This is a minimal valid copia-e-cola payload
    const copiaECola =
      '00020126580014br.gov.bcb.pix013636401fa8-b9c9-4d05-b43e-2aef6a22480552040000530398654071500.005802BR5913Joao da Silva6008Sao Paulo6304E2CA';

    const result = await sut.execute({ code: copiaECola });

    expect(result.pix.type).toBe('COPIA_COLA');
  });

  it('should throw BadRequestError for empty code', async () => {
    await expect(sut.execute({ code: '' })).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError for whitespace-only code', async () => {
    await expect(sut.execute({ code: '   ' })).rejects.toThrow(BadRequestError);
  });
});
