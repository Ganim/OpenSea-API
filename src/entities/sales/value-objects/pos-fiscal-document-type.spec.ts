import { describe, expect, it } from 'vitest';

import { PosFiscalDocumentType } from './pos-fiscal-document-type';

describe('PosFiscalDocumentType', () => {
  it('cria com valor válido NFE', () => {
    const vo = PosFiscalDocumentType.create('NFE');
    expect(vo.value).toBe('NFE');
  });

  it('cria com valor válido NFC_E', () => {
    const vo = PosFiscalDocumentType.create('NFC_E');
    expect(vo.value).toBe('NFC_E');
  });

  it('cria com valor válido SAT_CFE', () => {
    const vo = PosFiscalDocumentType.create('SAT_CFE');
    expect(vo.value).toBe('SAT_CFE');
  });

  it('cria com valor válido MFE', () => {
    const vo = PosFiscalDocumentType.create('MFE');
    expect(vo.value).toBe('MFE');
  });

  it('normaliza valor para uppercase', () => {
    const vo = PosFiscalDocumentType.create('nfc_e');
    expect(vo.value).toBe('NFC_E');
  });

  it('rejeita valor inválido', () => {
    expect(() => PosFiscalDocumentType.create('INVALID')).toThrow(
      'Invalid PosFiscalDocumentType: INVALID',
    );
  });

  it('toString retorna o valor', () => {
    expect(PosFiscalDocumentType.create('NFE').toString()).toBe('NFE');
  });

  it('equals compara mesmo valor', () => {
    expect(
      PosFiscalDocumentType.create('NFE').equals(
        PosFiscalDocumentType.create('NFE'),
      ),
    ).toBe(true);
    expect(
      PosFiscalDocumentType.create('NFE').equals(
        PosFiscalDocumentType.create('MFE'),
      ),
    ).toBe(false);
  });

  it('factories estáticas geram instâncias corretas', () => {
    expect(PosFiscalDocumentType.NFE().value).toBe('NFE');
    expect(PosFiscalDocumentType.NFC_E().value).toBe('NFC_E');
    expect(PosFiscalDocumentType.SAT_CFE().value).toBe('SAT_CFE');
    expect(PosFiscalDocumentType.MFE().value).toBe('MFE');
  });

  it('boolean getters refletem o valor', () => {
    const nfe = PosFiscalDocumentType.create('NFE');
    expect(nfe.isNfe).toBe(true);
    expect(nfe.isNfcE).toBe(false);
    expect(nfe.isSatCfe).toBe(false);
    expect(nfe.isMfe).toBe(false);

    const sat = PosFiscalDocumentType.create('SAT_CFE');
    expect(sat.isSatCfe).toBe(true);
  });
});
