import { describe, it, expect } from 'vitest';
import { S2399Builder } from './s2399-builder';
import type { S2399Input } from './s2399-builder';

describe('S2399Builder', () => {
  const builder = new S2399Builder();

  const baseInput: S2399Input = {
    tpInsc: 1,
    nrInsc: '12345678000195',
    cpfTrab: '12345678909',
    matricula: 'TSV001',
    codCateg: 721,
    dtTerm: new Date('2026-12-31'),
    mtvDesligTSV: '02',
  };

  it('should generate valid S-2399 XML with correct namespace', () => {
    const xml = builder.build(baseInput);

    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(xml).toContain(
      'xmlns="http://www.esocial.gov.br/schema/evt/evtTSVTermino/vS_01_02_00"',
    );
    expect(xml).toMatch(/<evtTSVTermino Id="ID1/);
  });

  it('should include ideTrabSemVinculo with CPF, matricula, and codCateg', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<ideTrabSemVinculo>');
    expect(xml).toContain('<cpfTrab>12345678909</cpfTrab>');
    expect(xml).toContain('<matricula>TSV001</matricula>');
    expect(xml).toContain('<codCateg>721</codCateg>');
  });

  it('should include infoTSVTermino with dtTerm and mtvDesligTSV', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<infoTSVTermino>');
    expect(xml).toContain('<dtTerm>2026-12-31</dtTerm>');
    expect(xml).toContain('<mtvDesligTSV>02</mtvDesligTSV>');
  });

  it('should omit mtvDesligTSV when not provided', () => {
    const input: S2399Input = {
      ...baseInput,
      mtvDesligTSV: undefined,
    };
    const xml = builder.build(input);

    expect(xml).not.toContain('<mtvDesligTSV>');
    expect(xml).toContain('<dtTerm>2026-12-31</dtTerm>');
  });

  it('should handle intern termination (codCateg 901)', () => {
    const input: S2399Input = {
      ...baseInput,
      codCateg: 901,
      mtvDesligTSV: '03',
    };
    const xml = builder.build(input);

    expect(xml).toContain('<codCateg>901</codCateg>');
    expect(xml).toContain('<mtvDesligTSV>03</mtvDesligTSV>');
  });

  it('should handle autonomous worker termination', () => {
    const input: S2399Input = {
      ...baseInput,
      codCateg: 701,
      mtvDesligTSV: '04',
    };
    const xml = builder.build(input);

    expect(xml).toContain('<codCateg>701</codCateg>');
    expect(xml).toContain('<mtvDesligTSV>04</mtvDesligTSV>');
  });

  it('should support retificacao', () => {
    const input: S2399Input = {
      ...baseInput,
      indRetif: 2,
      nrRecibo: 'REC-2399-001',
    };
    const xml = builder.build(input);

    expect(xml).toContain('<indRetif>2</indRetif>');
    expect(xml).toContain('<nrRecibo>REC-2399-001</nrRecibo>');
  });
});
