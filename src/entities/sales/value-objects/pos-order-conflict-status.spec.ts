import { describe, expect, it } from 'vitest';

import { PosOrderConflictStatus } from './pos-order-conflict-status';

describe('PosOrderConflictStatus', () => {
  it('cria com valor válido PENDING_RESOLUTION', () => {
    const vo = PosOrderConflictStatus.create('PENDING_RESOLUTION');
    expect(vo.value).toBe('PENDING_RESOLUTION');
  });

  it('cria com valor válido AUTO_SUBSTITUTED', () => {
    const vo = PosOrderConflictStatus.create('AUTO_SUBSTITUTED');
    expect(vo.value).toBe('AUTO_SUBSTITUTED');
  });

  it('cria com valor válido AUTO_ADJUSTED', () => {
    const vo = PosOrderConflictStatus.create('AUTO_ADJUSTED');
    expect(vo.value).toBe('AUTO_ADJUSTED');
  });

  it('cria com valor válido CANCELED_REFUNDED', () => {
    const vo = PosOrderConflictStatus.create('CANCELED_REFUNDED');
    expect(vo.value).toBe('CANCELED_REFUNDED');
  });

  it('cria com valor válido FORCED_ADJUSTMENT', () => {
    const vo = PosOrderConflictStatus.create('FORCED_ADJUSTMENT');
    expect(vo.value).toBe('FORCED_ADJUSTMENT');
  });

  it('cria com valor válido ITEM_SUBSTITUTED_MANUAL', () => {
    const vo = PosOrderConflictStatus.create('ITEM_SUBSTITUTED_MANUAL');
    expect(vo.value).toBe('ITEM_SUBSTITUTED_MANUAL');
  });

  it('cria com valor válido EXPIRED', () => {
    const vo = PosOrderConflictStatus.create('EXPIRED');
    expect(vo.value).toBe('EXPIRED');
  });

  it('normaliza valor para uppercase', () => {
    const vo = PosOrderConflictStatus.create('pending_resolution');
    expect(vo.value).toBe('PENDING_RESOLUTION');
  });

  it('rejeita valor inválido', () => {
    expect(() => PosOrderConflictStatus.create('INVALID')).toThrow(
      'Invalid PosOrderConflictStatus: INVALID',
    );
  });

  it('toString retorna o valor', () => {
    expect(PosOrderConflictStatus.create('EXPIRED').toString()).toBe('EXPIRED');
  });

  it('equals compara mesmo valor', () => {
    expect(
      PosOrderConflictStatus.create('EXPIRED').equals(
        PosOrderConflictStatus.create('EXPIRED'),
      ),
    ).toBe(true);
    expect(
      PosOrderConflictStatus.create('EXPIRED').equals(
        PosOrderConflictStatus.create('AUTO_ADJUSTED'),
      ),
    ).toBe(false);
  });

  it('factories estáticas geram instâncias corretas', () => {
    expect(PosOrderConflictStatus.PENDING_RESOLUTION().value).toBe(
      'PENDING_RESOLUTION',
    );
    expect(PosOrderConflictStatus.AUTO_SUBSTITUTED().value).toBe(
      'AUTO_SUBSTITUTED',
    );
    expect(PosOrderConflictStatus.AUTO_ADJUSTED().value).toBe('AUTO_ADJUSTED');
    expect(PosOrderConflictStatus.CANCELED_REFUNDED().value).toBe(
      'CANCELED_REFUNDED',
    );
    expect(PosOrderConflictStatus.FORCED_ADJUSTMENT().value).toBe(
      'FORCED_ADJUSTMENT',
    );
    expect(PosOrderConflictStatus.ITEM_SUBSTITUTED_MANUAL().value).toBe(
      'ITEM_SUBSTITUTED_MANUAL',
    );
    expect(PosOrderConflictStatus.EXPIRED().value).toBe('EXPIRED');
  });

  it('boolean getters refletem o valor', () => {
    const pending = PosOrderConflictStatus.create('PENDING_RESOLUTION');
    expect(pending.isPendingResolution).toBe(true);
    expect(pending.isAutoSubstituted).toBe(false);

    const expired = PosOrderConflictStatus.create('EXPIRED');
    expect(expired.isExpired).toBe(true);
    expect(expired.isResolved).toBe(false);
  });

  it('isResolved retorna true para estados resolvidos', () => {
    expect(PosOrderConflictStatus.create('AUTO_SUBSTITUTED').isResolved).toBe(
      true,
    );
    expect(PosOrderConflictStatus.create('AUTO_ADJUSTED').isResolved).toBe(
      true,
    );
    expect(PosOrderConflictStatus.create('CANCELED_REFUNDED').isResolved).toBe(
      true,
    );
    expect(PosOrderConflictStatus.create('FORCED_ADJUSTMENT').isResolved).toBe(
      true,
    );
    expect(
      PosOrderConflictStatus.create('ITEM_SUBSTITUTED_MANUAL').isResolved,
    ).toBe(true);
  });

  it('isResolved retorna false para PENDING_RESOLUTION e EXPIRED', () => {
    expect(PosOrderConflictStatus.create('PENDING_RESOLUTION').isResolved).toBe(
      false,
    );
    expect(PosOrderConflictStatus.create('EXPIRED').isResolved).toBe(false);
  });
});
