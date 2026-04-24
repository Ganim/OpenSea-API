import { describe, expect, it } from 'vitest';

import { PosCoordinationMode } from './pos-coordination-mode';

describe('PosCoordinationMode', () => {
  it('cria com valor válido STANDALONE', () => {
    const vo = PosCoordinationMode.create('STANDALONE');
    expect(vo.value).toBe('STANDALONE');
  });

  it('cria com valor válido SELLER', () => {
    const vo = PosCoordinationMode.create('SELLER');
    expect(vo.value).toBe('SELLER');
  });

  it('cria com valor válido CASHIER', () => {
    const vo = PosCoordinationMode.create('CASHIER');
    expect(vo.value).toBe('CASHIER');
  });

  it('cria com valor válido BOTH', () => {
    const vo = PosCoordinationMode.create('BOTH');
    expect(vo.value).toBe('BOTH');
  });

  it('normaliza valor para uppercase', () => {
    const vo = PosCoordinationMode.create('standalone');
    expect(vo.value).toBe('STANDALONE');
  });

  it('rejeita valor inválido', () => {
    expect(() => PosCoordinationMode.create('INVALID')).toThrow(
      'Invalid PosCoordinationMode: INVALID',
    );
  });

  it('toString retorna o valor', () => {
    expect(PosCoordinationMode.create('SELLER').toString()).toBe('SELLER');
  });

  it('equals compara mesmo valor', () => {
    expect(
      PosCoordinationMode.create('CASHIER').equals(
        PosCoordinationMode.create('CASHIER'),
      ),
    ).toBe(true);
    expect(
      PosCoordinationMode.create('CASHIER').equals(
        PosCoordinationMode.create('SELLER'),
      ),
    ).toBe(false);
  });

  it('factories estáticas geram instâncias corretas', () => {
    expect(PosCoordinationMode.STANDALONE().value).toBe('STANDALONE');
    expect(PosCoordinationMode.SELLER().value).toBe('SELLER');
    expect(PosCoordinationMode.CASHIER().value).toBe('CASHIER');
    expect(PosCoordinationMode.BOTH().value).toBe('BOTH');
  });

  it('boolean getters refletem o valor', () => {
    const standalone = PosCoordinationMode.create('STANDALONE');
    expect(standalone.isStandalone).toBe(true);
    expect(standalone.isSeller).toBe(false);
    expect(standalone.isCashier).toBe(false);
    expect(standalone.isBoth).toBe(false);

    const both = PosCoordinationMode.create('BOTH');
    expect(both.isBoth).toBe(true);
    expect(both.isStandalone).toBe(false);
  });
});
