import { describe, expect, it } from 'vitest';

import { PosFiscalEmissionMode } from './pos-fiscal-emission-mode';

describe('PosFiscalEmissionMode', () => {
  it('cria com valor válido ONLINE_SYNC', () => {
    const vo = PosFiscalEmissionMode.create('ONLINE_SYNC');
    expect(vo.value).toBe('ONLINE_SYNC');
  });

  it('cria com valor válido OFFLINE_CONTINGENCY', () => {
    const vo = PosFiscalEmissionMode.create('OFFLINE_CONTINGENCY');
    expect(vo.value).toBe('OFFLINE_CONTINGENCY');
  });

  it('cria com valor válido NONE', () => {
    const vo = PosFiscalEmissionMode.create('NONE');
    expect(vo.value).toBe('NONE');
  });

  it('normaliza valor para uppercase', () => {
    const vo = PosFiscalEmissionMode.create('online_sync');
    expect(vo.value).toBe('ONLINE_SYNC');
  });

  it('rejeita valor inválido', () => {
    expect(() => PosFiscalEmissionMode.create('INVALID')).toThrow(
      'Invalid PosFiscalEmissionMode: INVALID',
    );
  });

  it('toString retorna o valor', () => {
    expect(PosFiscalEmissionMode.create('ONLINE_SYNC').toString()).toBe(
      'ONLINE_SYNC',
    );
  });

  it('equals compara mesmo valor', () => {
    expect(
      PosFiscalEmissionMode.create('NONE').equals(
        PosFiscalEmissionMode.create('NONE'),
      ),
    ).toBe(true);
    expect(
      PosFiscalEmissionMode.create('NONE').equals(
        PosFiscalEmissionMode.create('ONLINE_SYNC'),
      ),
    ).toBe(false);
  });

  it('factories estáticas geram instâncias corretas', () => {
    expect(PosFiscalEmissionMode.ONLINE_SYNC().value).toBe('ONLINE_SYNC');
    expect(PosFiscalEmissionMode.OFFLINE_CONTINGENCY().value).toBe(
      'OFFLINE_CONTINGENCY',
    );
    expect(PosFiscalEmissionMode.NONE().value).toBe('NONE');
  });

  it('boolean getters refletem o valor', () => {
    const online = PosFiscalEmissionMode.create('ONLINE_SYNC');
    expect(online.isOnlineSync).toBe(true);
    expect(online.isOfflineContingency).toBe(false);
    expect(online.isNone).toBe(false);

    const offline = PosFiscalEmissionMode.create('OFFLINE_CONTINGENCY');
    expect(offline.isOfflineContingency).toBe(true);

    const none = PosFiscalEmissionMode.create('NONE');
    expect(none.isNone).toBe(true);
  });
});
