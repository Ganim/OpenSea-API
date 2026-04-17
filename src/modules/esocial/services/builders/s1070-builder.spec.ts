import { describe, it, expect } from 'vitest';
import { S1070Builder } from './s1070-builder';
import type { S1070Input } from './s1070-builder';

describe('S1070Builder', () => {
  const builder = new S1070Builder();

  const baseInput: S1070Input = {
    tpInsc: 1,
    nrInsc: '12345678000195',
    tpProc: 2,
    nrProc: '0001234-56.2025.5.01.0001',
    iniValid: '2026-01',
    indAutoria: 1,
    indMatProc: '01',
  };

  it('should generate valid S-1070 XML with correct namespace', () => {
    const xml = builder.build(baseInput);

    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(xml).toContain(
      'xmlns="http://www.esocial.gov.br/schema/evt/evtTabProcesso/vS_01_02_00"',
    );
    expect(xml).toMatch(/<evtTabProcesso Id="ID1/);
  });

  it('should include ideEvento with defaults', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<indRetif>1</indRetif>');
    expect(xml).toContain('<tpAmb>2</tpAmb>');
    expect(xml).toContain('<procEmi>1</procEmi>');
    expect(xml).toContain('<verProc>OpenSea-1.0</verProc>');
  });

  it('should include ideProcesso with process type and number', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<ideProcesso>');
    expect(xml).toContain('<tpProc>2</tpProc>');
    expect(xml).toContain('<nrProc>0001234-56.2025.5.01.0001</nrProc>');
    expect(xml).toContain('<iniValid>2026-01</iniValid>');
  });

  it('should support administrative process type', () => {
    const input: S1070Input = {
      ...baseInput,
      tpProc: 1,
      nrProc: 'ADM-2025-000123',
    };
    const xml = builder.build(input);

    expect(xml).toContain('<tpProc>1</tpProc>');
    expect(xml).toContain('<nrProc>ADM-2025-000123</nrProc>');
  });

  it('should include dadosProc with indAutoria and indMatProc', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<dadosProc>');
    expect(xml).toContain('<indAutoria>1</indAutoria>');
    expect(xml).toContain('<indMatProc>01</indMatProc>');
  });

  it('should include observacao when provided', () => {
    const input: S1070Input = {
      ...baseInput,
      observacao: 'Processo de suspensao de contribuicao patronal INSS',
    };
    const xml = builder.build(input);

    expect(xml).toContain(
      '<observacao>Processo de suspensao de contribuicao patronal INSS</observacao>',
    );
  });

  it('should include single infoSusp block', () => {
    const input: S1070Input = {
      ...baseInput,
      infoSusp: [
        {
          codSusp: '01',
          indSusp: '01',
          dtDecisao: new Date('2025-06-15T12:00:00Z'),
          indDeposito: 'N',
        },
      ],
    };
    const xml = builder.build(input);

    expect(xml).toContain('<infoSusp>');
    expect(xml).toContain('<codSusp>01</codSusp>');
    expect(xml).toContain('<indSusp>01</indSusp>');
    expect(xml).toContain('<dtDecisao>2025-06-15</dtDecisao>');
    expect(xml).toContain('<indDeposito>N</indDeposito>');
  });

  it('should include multiple infoSusp blocks', () => {
    const input: S1070Input = {
      ...baseInput,
      infoSusp: [
        {
          codSusp: '01',
          indSusp: '01',
          dtDecisao: new Date('2025-03-10T12:00:00Z'),
        },
        {
          codSusp: '02',
          indSusp: '03',
          dtDecisao: new Date('2025-09-20T12:00:00Z'),
          indDeposito: 'S',
        },
      ],
    };
    const xml = builder.build(input);

    // Both suspension blocks should be present
    const infoSuspMatches = xml.match(/<infoSusp>/g);
    expect(infoSuspMatches).toHaveLength(2);

    expect(xml).toContain('<codSusp>01</codSusp>');
    expect(xml).toContain('<codSusp>02</codSusp>');
    expect(xml).toContain('<dtDecisao>2025-03-10</dtDecisao>');
    expect(xml).toContain('<dtDecisao>2025-09-20</dtDecisao>');
    expect(xml).toContain('<indDeposito>S</indDeposito>');
  });

  it('should not include infoSusp when absent', () => {
    const xml = builder.build(baseInput);

    expect(xml).not.toContain('<infoSusp>');
  });

  it('should include fimValid when provided', () => {
    const input: S1070Input = {
      ...baseInput,
      fimValid: '2026-12',
    };
    const xml = builder.build(input);

    expect(xml).toContain('<fimValid>2026-12</fimValid>');
  });

  it('should support retificacao mode', () => {
    const input: S1070Input = {
      ...baseInput,
      indRetif: 2,
      nrRecibo: 'REC-S1070-001',
    };
    const xml = builder.build(input);

    expect(xml).toContain('<indRetif>2</indRetif>');
    expect(xml).toContain('<nrRecibo>REC-S1070-001</nrRecibo>');
  });

  it('should wrap content in inclusao > infoProcesso hierarchy', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<infoProcesso>');
    expect(xml).toContain('<inclusao>');
    expect(xml).toContain('<ideProcesso>');
    expect(xml).toContain('<dadosProc>');
  });

  it('should support different indAutoria values', () => {
    const employeeAuthored: S1070Input = {
      ...baseInput,
      indAutoria: 2,
    };
    const xml = builder.build(employeeAuthored);
    expect(xml).toContain('<indAutoria>2</indAutoria>');

    const otherAuthored: S1070Input = {
      ...baseInput,
      indAutoria: 3,
    };
    const xmlOther = builder.build(otherAuthored);
    expect(xmlOther).toContain('<indAutoria>3</indAutoria>');
  });

  it('should accept ISO string dates for infoSusp dtDecisao', () => {
    const input: S1070Input = {
      ...baseInput,
      infoSusp: [
        {
          codSusp: '01',
          indSusp: '02',
          dtDecisao: '2025-11-30T12:00:00.000Z',
        },
      ],
    };
    const xml = builder.build(input);

    expect(xml).toContain('<dtDecisao>2025-11-30</dtDecisao>');
  });

  it('should support producao environment', () => {
    const input: S1070Input = {
      ...baseInput,
      tpAmb: 1,
    };
    const xml = builder.build(input);

    expect(xml).toContain('<tpAmb>1</tpAmb>');
  });
});
