import { describe, it, expect } from 'vitest';
import { S1020Builder } from './s1020-builder';
import type { S1020Input } from './s1020-builder';

describe('S1020Builder', () => {
  const builder = new S1020Builder();

  const baseInput: S1020Input = {
    tpInsc: 1,
    nrInsc: '12345678000195',
    codLotacao: 'LOT-PRINCIPAL',
    iniValid: '2026-01',
    tpLotacao: '01',
    fpas: '515',
    codTercs: '0079',
  };

  it('should generate valid S-1020 XML with correct namespace', () => {
    const xml = builder.build(baseInput);

    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(xml).toContain(
      'xmlns="http://www.esocial.gov.br/schema/evt/evtTabLotacao/vS_01_02_00"',
    );
    expect(xml).toMatch(/<evtTabLotacao Id="ID1/);
  });

  it('should include ideEvento with defaults', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<indRetif>1</indRetif>');
    expect(xml).toContain('<tpAmb>2</tpAmb>');
    expect(xml).toContain('<procEmi>1</procEmi>');
    expect(xml).toContain('<verProc>OpenSea-1.0</verProc>');
  });

  it('should include ideLotacao with code and period', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<codLotacao>LOT-PRINCIPAL</codLotacao>');
    expect(xml).toContain('<iniValid>2026-01</iniValid>');
  });

  it('should include fimValid when provided', () => {
    const input: S1020Input = {
      ...baseInput,
      fimValid: '2026-12',
    };
    const xml = builder.build(input);

    expect(xml).toContain('<fimValid>2026-12</fimValid>');
  });

  it('should include dadosLotacao with tpLotacao', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<tpLotacao>01</tpLotacao>');
  });

  it('should include fpasLotacao with FPAS and codTercs', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<fpasLotacao>');
    expect(xml).toContain('<fpas>515</fpas>');
    expect(xml).toContain('<codTercs>0079</codTercs>');
  });

  it('should include codTercsSusp when provided', () => {
    const input: S1020Input = {
      ...baseInput,
      codTercsSusp: '0015',
    };
    const xml = builder.build(input);

    expect(xml).toContain('<codTercsSusp>0015</codTercsSusp>');
  });

  it('should include tpInsc and nrInsc for lotacao when provided', () => {
    const input: S1020Input = {
      ...baseInput,
      tpLotacao: '04',
      tpInscLot: 1,
      nrInscLot: '98765432000100',
    };
    const xml = builder.build(input);

    expect(xml).toContain('<tpLotacao>04</tpLotacao>');
    expect(xml).toContain('<dadosLotacao>');
    // Inside dadosLotacao
    expect(xml).toMatch(
      /<dadosLotacao>.*<tpInsc>1<\/tpInsc>.*<nrInsc>98765432000100<\/nrInsc>/s,
    );
  });

  it('should include infoProcJudTerceiros when nrProcJud is provided', () => {
    const input: S1020Input = {
      ...baseInput,
      nrProcJud: '0001234-56.2025.5.01.0001',
      codTerc: '0064',
    };
    const xml = builder.build(input);

    expect(xml).toContain('<infoProcJudTerceiros>');
    expect(xml).toContain('<procJudTerceiro>');
    expect(xml).toContain('<nrProcJud>0001234-56.2025.5.01.0001</nrProcJud>');
    expect(xml).toContain('<codTerc>0064</codTerc>');
  });

  it('should not include infoProcJudTerceiros when nrProcJud is absent', () => {
    const xml = builder.build(baseInput);

    expect(xml).not.toContain('<infoProcJudTerceiros>');
    expect(xml).not.toContain('<procJudTerceiro>');
  });

  it('should support retificacao mode', () => {
    const input: S1020Input = {
      ...baseInput,
      indRetif: 2,
      nrRecibo: 'REC-S1020-001',
    };
    const xml = builder.build(input);

    expect(xml).toContain('<indRetif>2</indRetif>');
    expect(xml).toContain('<nrRecibo>REC-S1020-001</nrRecibo>');
  });

  it('should wrap content in inclusao > infoLotacao hierarchy', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<infoLotacao>');
    expect(xml).toContain('<inclusao>');
    expect(xml).toContain('<ideLotacao>');
    expect(xml).toContain('<dadosLotacao>');
  });

  it('should support producao environment', () => {
    const input: S1020Input = {
      ...baseInput,
      tpAmb: 1,
    };
    const xml = builder.build(input);

    expect(xml).toContain('<tpAmb>1</tpAmb>');
  });
});
