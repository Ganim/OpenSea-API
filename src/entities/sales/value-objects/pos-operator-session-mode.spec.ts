import { describe, expect, it } from 'vitest';

import { PosOperatorSessionMode } from './pos-operator-session-mode';

describe('PosOperatorSessionMode', () => {
  it('cria com valor válido PER_SALE', () => {
    const vo = PosOperatorSessionMode.create('PER_SALE');
    expect(vo.value).toBe('PER_SALE');
  });

  it('cria com valor válido STAY_LOGGED_IN', () => {
    const vo = PosOperatorSessionMode.create('STAY_LOGGED_IN');
    expect(vo.value).toBe('STAY_LOGGED_IN');
  });

  it('normaliza valor para uppercase', () => {
    const vo = PosOperatorSessionMode.create('per_sale');
    expect(vo.value).toBe('PER_SALE');
  });

  it('rejeita valor inválido', () => {
    expect(() => PosOperatorSessionMode.create('INVALID')).toThrow(
      'Invalid PosOperatorSessionMode: INVALID',
    );
  });

  it('toString retorna o valor', () => {
    expect(PosOperatorSessionMode.create('PER_SALE').toString()).toBe(
      'PER_SALE',
    );
  });

  it('equals compara mesmo valor', () => {
    expect(
      PosOperatorSessionMode.create('PER_SALE').equals(
        PosOperatorSessionMode.create('PER_SALE'),
      ),
    ).toBe(true);
    expect(
      PosOperatorSessionMode.create('PER_SALE').equals(
        PosOperatorSessionMode.create('STAY_LOGGED_IN'),
      ),
    ).toBe(false);
  });

  it('factories estáticas geram instâncias corretas', () => {
    expect(PosOperatorSessionMode.PER_SALE().value).toBe('PER_SALE');
    expect(PosOperatorSessionMode.STAY_LOGGED_IN().value).toBe(
      'STAY_LOGGED_IN',
    );
  });

  it('boolean getters refletem o valor', () => {
    const perSale = PosOperatorSessionMode.create('PER_SALE');
    expect(perSale.isPerSale).toBe(true);
    expect(perSale.isStayLoggedIn).toBe(false);

    const stay = PosOperatorSessionMode.create('STAY_LOGGED_IN');
    expect(stay.isPerSale).toBe(false);
    expect(stay.isStayLoggedIn).toBe(true);
  });
});
