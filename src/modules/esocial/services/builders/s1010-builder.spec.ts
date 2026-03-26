import { describe, it, expect } from 'vitest';
import { S1010Builder } from './s1010-builder';
import type { S1010Input } from './s1010-builder';

describe('S1010Builder', () => {
  const builder = new S1010Builder();

  const baseInput: S1010Input = {
    tpInsc: 1,
    nrInsc: '12345678000195',
    codRubr: 'SAL-BASE-001',
    iniValid: '2026-01',
    dscRubr: 'Salario Base',
    natRubr: '1000',
    tpRubr: 1,
    codIncCP: '11',
    codIncIRRF: '11',
    codIncFGTS: '11',
  };

  it('should generate valid S-1010 XML with correct namespace', () => {
    const xml = builder.build(baseInput);

    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(xml).toContain(
      'xmlns="http://www.esocial.gov.br/schema/evt/evtTabRubrica/vS_01_02_00"',
    );
    expect(xml).toMatch(/<evtTabRubrica Id="ID1/);
  });

  it('should include ideEvento with defaults', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<indRetif>1</indRetif>');
    expect(xml).toContain('<tpAmb>2</tpAmb>');
    expect(xml).toContain('<procEmi>1</procEmi>');
    expect(xml).toContain('<verProc>OpenSea-1.0</verProc>');
  });

  it('should include ideRubrica with code and table identifier', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<codRubr>SAL-BASE-001</codRubr>');
    expect(xml).toContain('<ideTabRubr>1</ideTabRubr>');
    expect(xml).toContain('<iniValid>2026-01</iniValid>');
  });

  it('should use custom ideTabRubr when provided', () => {
    const input: S1010Input = {
      ...baseInput,
      ideTabRubr: '2',
    };
    const xml = builder.build(input);

    expect(xml).toContain('<ideTabRubr>2</ideTabRubr>');
  });

  it('should include dadosRubrica with all required fields', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<dscRubr>Salario Base</dscRubr>');
    expect(xml).toContain('<natRubr>1000</natRubr>');
    expect(xml).toContain('<tpRubr>1</tpRubr>');
    expect(xml).toContain('<codIncCP>11</codIncCP>');
    expect(xml).toContain('<codIncIRRF>11</codIncIRRF>');
    expect(xml).toContain('<codIncFGTS>11</codIncFGTS>');
  });

  it('should include desconto rubrica type', () => {
    const input: S1010Input = {
      ...baseInput,
      codRubr: 'DESC-INSS-001',
      dscRubr: 'Desconto INSS',
      tpRubr: 2,
      natRubr: '9201',
    };
    const xml = builder.build(input);

    expect(xml).toContain('<tpRubr>2</tpRubr>');
    expect(xml).toContain('<dscRubr>Desconto INSS</dscRubr>');
  });

  it('should include informativa rubrica type', () => {
    const input: S1010Input = {
      ...baseInput,
      codRubr: 'INFO-BASE-FGTS',
      dscRubr: 'Base de Calculo FGTS',
      tpRubr: 3,
      natRubr: '9900',
    };
    const xml = builder.build(input);

    expect(xml).toContain('<tpRubr>3</tpRubr>');
  });

  it('should include optional fatorRubr as formatted money', () => {
    const input: S1010Input = {
      ...baseInput,
      fatorRubr: 1.5,
    };
    const xml = builder.build(input);

    expect(xml).toContain('<fatorRubr>1.50</fatorRubr>');
  });

  it('should include optional codIncSIND', () => {
    const input: S1010Input = {
      ...baseInput,
      codIncSIND: '31',
    };
    const xml = builder.build(input);

    expect(xml).toContain('<codIncSIND>31</codIncSIND>');
  });

  it('should include optional observacao', () => {
    const input: S1010Input = {
      ...baseInput,
      observacao: 'Rubrica principal de salario base mensal',
    };
    const xml = builder.build(input);

    expect(xml).toContain(
      '<observacao>Rubrica principal de salario base mensal</observacao>',
    );
  });

  it('should include fimValid when provided', () => {
    const input: S1010Input = {
      ...baseInput,
      fimValid: '2026-12',
    };
    const xml = builder.build(input);

    expect(xml).toContain('<fimValid>2026-12</fimValid>');
  });

  it('should support retificacao mode', () => {
    const input: S1010Input = {
      ...baseInput,
      indRetif: 2,
      nrRecibo: 'REC-S1010-001',
    };
    const xml = builder.build(input);

    expect(xml).toContain('<indRetif>2</indRetif>');
    expect(xml).toContain('<nrRecibo>REC-S1010-001</nrRecibo>');
  });

  it('should wrap content in inclusao > infoRubrica hierarchy', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<infoRubrica>');
    expect(xml).toContain('<inclusao>');
    expect(xml).toContain('<ideRubrica>');
    expect(xml).toContain('<dadosRubrica>');
  });

  it('should escape special XML characters in description', () => {
    const input: S1010Input = {
      ...baseInput,
      dscRubr: 'Hora Extra > 50% & Noturno',
    };
    const xml = builder.build(input);

    expect(xml).toContain(
      '<dscRubr>Hora Extra &gt; 50% &amp; Noturno</dscRubr>',
    );
  });
});
