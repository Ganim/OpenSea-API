import { describe, it, expect } from 'vitest';
import { S2298Builder } from './s2298-builder';
import type { S2298Input } from './s2298-builder';

describe('S2298Builder', () => {
  const builder = new S2298Builder();

  const baseInput: S2298Input = {
    tpInsc: 1,
    nrInsc: '12345678000195',
    cpfTrab: '12345678909',
    matricula: 'EMP001',
    tpReint: 1,
    nrProcJud: '0001234-56.2026.5.01.0001',
    dtReint: new Date('2026-07-01'),
    dtEfetRetorno: new Date('2026-07-15'),
  };

  it('should generate valid S-2298 XML with correct namespace', () => {
    const xml = builder.build(baseInput);

    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(xml).toContain(
      'xmlns="http://www.esocial.gov.br/schema/evt/evtReintegr/vS_01_02_00"',
    );
    expect(xml).toMatch(/<evtReintegr Id="ID1/);
  });

  it('should include ideVinculo', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<ideVinculo>');
    expect(xml).toContain('<cpfTrab>12345678909</cpfTrab>');
    expect(xml).toContain('<matricula>EMP001</matricula>');
  });

  it('should include infoReintegr with all fields', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<infoReintegr>');
    expect(xml).toContain('<tpReint>1</tpReint>');
    expect(xml).toContain('<nrProcJud>0001234-56.2026.5.01.0001</nrProcJud>');
    expect(xml).toContain('<dtReint>2026-07-01</dtReint>');
    expect(xml).toContain('<dtEfetRetorno>2026-07-15</dtEfetRetorno>');
  });

  it('should omit nrProcJud when not provided', () => {
    const input: S2298Input = {
      ...baseInput,
      tpReint: 2,
      nrProcJud: undefined,
    };
    const xml = builder.build(input);

    expect(xml).toContain('<tpReint>2</tpReint>');
    expect(xml).not.toContain('<nrProcJud>');
  });

  it('should omit dtEfetRetorno when not provided', () => {
    const input: S2298Input = {
      ...baseInput,
      dtEfetRetorno: undefined,
    };
    const xml = builder.build(input);

    expect(xml).not.toContain('<dtEfetRetorno>');
  });

  it('should handle all reintegration types', () => {
    for (const tpReint of [1, 2, 3, 4, 5, 9]) {
      const input: S2298Input = {
        ...baseInput,
        tpReint,
        nrProcJud: tpReint === 1 ? '0001234-56.2026.5.01.0001' : undefined,
      };
      const xml = builder.build(input);
      expect(xml).toContain(`<tpReint>${tpReint}</tpReint>`);
    }
  });

  it('should support retificacao', () => {
    const input: S2298Input = {
      ...baseInput,
      indRetif: 2,
      nrRecibo: 'REC-2298-001',
    };
    const xml = builder.build(input);

    expect(xml).toContain('<indRetif>2</indRetif>');
    expect(xml).toContain('<nrRecibo>REC-2298-001</nrRecibo>');
  });
});
