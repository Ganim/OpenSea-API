import { describe, expect, it } from 'vitest';

import { PosZoneTier } from './pos-zone-tier';

describe('PosZoneTier', () => {
  it('cria com valor válido PRIMARY', () => {
    const vo = PosZoneTier.create('PRIMARY');
    expect(vo.value).toBe('PRIMARY');
  });

  it('cria com valor válido SECONDARY', () => {
    const vo = PosZoneTier.create('SECONDARY');
    expect(vo.value).toBe('SECONDARY');
  });

  it('normaliza valor para uppercase', () => {
    const vo = PosZoneTier.create('primary');
    expect(vo.value).toBe('PRIMARY');
  });

  it('rejeita valor inválido', () => {
    expect(() => PosZoneTier.create('TERTIARY')).toThrow(
      'Invalid PosZoneTier: TERTIARY',
    );
  });

  it('toString retorna o valor', () => {
    expect(PosZoneTier.create('PRIMARY').toString()).toBe('PRIMARY');
  });

  it('equals compara mesmo valor', () => {
    expect(
      PosZoneTier.create('PRIMARY').equals(PosZoneTier.create('PRIMARY')),
    ).toBe(true);
    expect(
      PosZoneTier.create('PRIMARY').equals(PosZoneTier.create('SECONDARY')),
    ).toBe(false);
  });

  it('factories estáticas geram instâncias corretas', () => {
    expect(PosZoneTier.PRIMARY().value).toBe('PRIMARY');
    expect(PosZoneTier.SECONDARY().value).toBe('SECONDARY');
  });

  it('boolean getters refletem o valor', () => {
    const primary = PosZoneTier.create('PRIMARY');
    expect(primary.isPrimary).toBe(true);
    expect(primary.isSecondary).toBe(false);

    const secondary = PosZoneTier.create('SECONDARY');
    expect(secondary.isPrimary).toBe(false);
    expect(secondary.isSecondary).toBe(true);
  });
});
