import { describe, expect, it } from 'vitest';

import { OrderOriginSource } from './order-origin-source';

describe('OrderOriginSource', () => {
  it('cria com valor válido WEB', () => {
    const vo = OrderOriginSource.create('WEB');
    expect(vo.value).toBe('WEB');
  });

  it('cria com valor válido POS_DESKTOP', () => {
    const vo = OrderOriginSource.create('POS_DESKTOP');
    expect(vo.value).toBe('POS_DESKTOP');
  });

  it('cria com valor válido API', () => {
    const vo = OrderOriginSource.create('API');
    expect(vo.value).toBe('API');
  });

  it('cria com valor válido MOBILE', () => {
    const vo = OrderOriginSource.create('MOBILE');
    expect(vo.value).toBe('MOBILE');
  });

  it('normaliza valor para uppercase', () => {
    const vo = OrderOriginSource.create('pos_desktop');
    expect(vo.value).toBe('POS_DESKTOP');
  });

  it('rejeita valor inválido', () => {
    expect(() => OrderOriginSource.create('INVALID')).toThrow(
      'Invalid OrderOriginSource: INVALID',
    );
  });

  it('toString retorna o valor', () => {
    expect(OrderOriginSource.create('WEB').toString()).toBe('WEB');
  });

  it('equals compara mesmo valor', () => {
    expect(
      OrderOriginSource.create('WEB').equals(OrderOriginSource.create('WEB')),
    ).toBe(true);
    expect(
      OrderOriginSource.create('WEB').equals(
        OrderOriginSource.create('POS_DESKTOP'),
      ),
    ).toBe(false);
  });

  it('factories estáticas geram instâncias corretas', () => {
    expect(OrderOriginSource.WEB().value).toBe('WEB');
    expect(OrderOriginSource.POS_DESKTOP().value).toBe('POS_DESKTOP');
    expect(OrderOriginSource.API().value).toBe('API');
    expect(OrderOriginSource.MOBILE().value).toBe('MOBILE');
  });

  it('boolean getters refletem o valor', () => {
    const web = OrderOriginSource.create('WEB');
    expect(web.isWeb).toBe(true);
    expect(web.isPosDesktop).toBe(false);
    expect(web.isApi).toBe(false);
    expect(web.isMobile).toBe(false);

    const pos = OrderOriginSource.create('POS_DESKTOP');
    expect(pos.isPosDesktop).toBe(true);
    expect(pos.isWeb).toBe(false);
  });
});
