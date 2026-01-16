import { beforeEach, describe, expect, it } from 'vitest';
import { ParseAddressUseCase } from './parse-address';

let sut: ParseAddressUseCase;

describe('ParseAddressUseCase', () => {
  beforeEach(() => {
    sut = new ParseAddressUseCase();
  });

  it('should parse a valid address with hyphen separator', async () => {
    const result = await sut.execute({
      address: 'FAB-EST-102-B',
    });

    expect(result.valid).toBe(true);
    expect(result.components).not.toBeNull();
    expect(result.components?.warehouseCode).toBe('FAB');
    expect(result.components?.zoneCode).toBe('EST');
    expect(result.components?.aisle).toBe(1);
    expect(result.components?.shelf).toBe(2);
    expect(result.components?.bin).toBe('B');
    expect(result.components?.separator).toBe('-');
    expect(result.normalizedAddress).toBe('FAB-EST-102-B');
  });

  it('should parse a valid address with dot separator', async () => {
    const result = await sut.execute({
      address: 'FAB.EST.102.B',
    });

    expect(result.valid).toBe(true);
    expect(result.components?.separator).toBe('.');
    expect(result.normalizedAddress).toBe('FAB.EST.102.B');
  });

  it('should parse a valid address with underscore separator', async () => {
    const result = await sut.execute({
      address: 'FAB_EST_102_B',
    });

    expect(result.valid).toBe(true);
    expect(result.components?.separator).toBe('_');
    expect(result.normalizedAddress).toBe('FAB_EST_102_B');
  });

  it('should normalize address to uppercase', async () => {
    const result = await sut.execute({
      address: 'fab-est-102-b',
    });

    expect(result.valid).toBe(true);
    expect(result.components?.warehouseCode).toBe('FAB');
    expect(result.components?.zoneCode).toBe('EST');
    expect(result.components?.bin).toBe('B');
    expect(result.normalizedAddress).toBe('FAB-EST-102-B');
  });

  it('should handle whitespace in address', async () => {
    const result = await sut.execute({
      address: '  FAB-EST-102-B  ',
    });

    expect(result.valid).toBe(true);
    expect(result.normalizedAddress).toBe('FAB-EST-102-B');
  });

  it('should parse 2-digit position (aisle 1, shelf 2)', async () => {
    const result = await sut.execute({
      address: 'FAB-EST-12-A',
    });

    expect(result.valid).toBe(true);
    expect(result.components?.aisle).toBe(1);
    expect(result.components?.shelf).toBe(2);
  });

  it('should parse 3-digit position (aisle 1, shelf 02)', async () => {
    const result = await sut.execute({
      address: 'FAB-EST-102-A',
    });

    expect(result.valid).toBe(true);
    expect(result.components?.aisle).toBe(1);
    expect(result.components?.shelf).toBe(2);
  });

  it('should parse 4-digit position (aisle 15, shelf 02)', async () => {
    const result = await sut.execute({
      address: 'FAB-EST-1502-A',
    });

    expect(result.valid).toBe(true);
    expect(result.components?.aisle).toBe(15);
    expect(result.components?.shelf).toBe(2);
  });

  it('should parse 2-character bin code', async () => {
    const result = await sut.execute({
      address: 'FAB-EST-102-AB',
    });

    expect(result.valid).toBe(true);
    expect(result.components?.bin).toBe('AB');
  });

  it('should parse numeric bin code', async () => {
    const result = await sut.execute({
      address: 'FAB-EST-102-1',
    });

    expect(result.valid).toBe(true);
    expect(result.components?.bin).toBe('1');
  });

  it('should fail when no separator is found', async () => {
    const result = await sut.execute({
      address: 'FABEST102B',
    });

    expect(result.valid).toBe(false);
    expect(result.components).toBeNull();
    expect(result.error).toContain('nenhum separador encontrado');
  });

  it('should fail when address has wrong number of parts', async () => {
    const result = await sut.execute({
      address: 'FAB-EST-102',
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain('esperado 4 partes');
  });

  it('should fail when address has too many parts', async () => {
    const result = await sut.execute({
      address: 'FAB-EST-102-B-EXTRA',
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain('esperado 4 partes');
  });

  it('should fail when warehouse code is too short', async () => {
    const result = await sut.execute({
      address: 'F-EST-102-B',
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Código do armazém inválido');
  });

  it('should fail when warehouse code is too long', async () => {
    const result = await sut.execute({
      address: 'FABRICA-EST-102-B',
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Código do armazém inválido');
  });

  it('should fail when zone code is too short', async () => {
    const result = await sut.execute({
      address: 'FAB-E-102-B',
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Código da zona inválido');
  });

  it('should fail when zone code is too long', async () => {
    const result = await sut.execute({
      address: 'FAB-ESTOQUE-102-B',
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Código da zona inválido');
  });

  it('should fail when position contains non-numeric characters', async () => {
    const result = await sut.execute({
      address: 'FAB-EST-10A-B',
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Posição inválida');
  });

  it('should fail when bin code is too long', async () => {
    const result = await sut.execute({
      address: 'FAB-EST-102-ABC',
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Código do nicho inválido');
  });

  it('should preserve original address in response', async () => {
    const originalAddress = '  fab-est-102-b  ';

    const result = await sut.execute({
      address: originalAddress,
    });

    expect(result.originalAddress).toBe(originalAddress);
  });

  it('should accept alphanumeric warehouse codes', async () => {
    const result = await sut.execute({
      address: 'WH01-EST-102-B',
    });

    expect(result.valid).toBe(true);
    expect(result.components?.warehouseCode).toBe('WH01');
  });

  it('should accept alphanumeric zone codes', async () => {
    const result = await sut.execute({
      address: 'FAB-Z01-102-B',
    });

    expect(result.valid).toBe(true);
    expect(result.components?.zoneCode).toBe('Z01');
  });
});
