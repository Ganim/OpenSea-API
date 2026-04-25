import { describe, expect, it } from 'vitest';

import { PosFiscalConfig } from './pos-fiscal-config';
import { PosFiscalDocumentType } from './value-objects/pos-fiscal-document-type';
import { PosFiscalEmissionMode } from './value-objects/pos-fiscal-emission-mode';

describe('PosFiscalConfig entity', () => {
  it('cria com emissionMode = ONLINE_SYNC por padrão', () => {
    const cfg = PosFiscalConfig.create({
      tenantId: 'tenant-1',
      enabledDocumentTypes: [PosFiscalDocumentType.NFC_E()],
      defaultDocumentType: PosFiscalDocumentType.NFC_E(),
    });

    expect(cfg.emissionMode.value).toBe('ONLINE_SYNC');
    expect(cfg.certificatePath).toBeNull();
    expect(cfg.nfceSeries).toBeNull();
    expect(cfg.nfceNextNumber).toBeNull();
    expect(cfg.satDeviceId).toBeNull();
  });

  it('incrementNfceNumber() retorna o valor atual e incrementa', () => {
    const cfg = PosFiscalConfig.create({
      tenantId: 'tenant-1',
      enabledDocumentTypes: [PosFiscalDocumentType.NFC_E()],
      defaultDocumentType: PosFiscalDocumentType.NFC_E(),
      nfceSeries: 1,
      nfceNextNumber: 100,
    });

    const current = cfg.incrementNfceNumber();

    expect(current).toBe(100);
    expect(cfg.nfceNextNumber).toBe(101);
    expect(cfg.updatedAt).toBeInstanceOf(Date);
  });

  it('incrementNfceNumber() lança erro se nfceNextNumber é null', () => {
    const cfg = PosFiscalConfig.create({
      tenantId: 'tenant-1',
      enabledDocumentTypes: [PosFiscalDocumentType.NFC_E()],
      defaultDocumentType: PosFiscalDocumentType.NFC_E(),
    });

    expect(() => cfg.incrementNfceNumber()).toThrow(
      'nfceNextNumber is not configured',
    );
  });

  it('setEmissionMode(NONE) atualiza modo e toca updatedAt', () => {
    const cfg = PosFiscalConfig.create({
      tenantId: 'tenant-1',
      enabledDocumentTypes: [PosFiscalDocumentType.NFC_E()],
      defaultDocumentType: PosFiscalDocumentType.NFC_E(),
    });

    cfg.setEmissionMode(PosFiscalEmissionMode.NONE());

    expect(cfg.emissionMode.value).toBe('NONE');
    expect(cfg.updatedAt).toBeInstanceOf(Date);
  });
});
