import { describe, it, expect } from 'vitest';
import { S2240Builder } from './s2240-builder';
import type { S2240Input } from './s2240-builder';

describe('S2240Builder', () => {
  const builder = new S2240Builder();

  const baseInput: S2240Input = {
    tpInsc: 1,
    nrInsc: '12345678000195',
    cpfTrab: '12345678909',
    matricula: 'EMP001',
    dtIniCondicao: new Date('2026-01-15'),
    infoAmb: {
      codAmb: 'PROD-01',
      dscSetor: 'Linha de Produção',
    },
    fatRisco: [
      {
        codFatRis: '02.01.001',
        dscFatRis: 'Ruído contínuo',
        tpAval: 2,
        intConc: 85,
        limTol: 85,
        unMed: 1,
        tecMedicao: 'Dosimetria',
        insalubridade: 'S',
        periculosidade: 'N',
        aposentEsp: 3,
      },
    ],
  };

  it('should generate valid S-2240 XML with correct namespace', () => {
    const xml = builder.build(baseInput);

    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(xml).toContain(
      'xmlns="http://www.esocial.gov.br/schema/evt/evtExpRisco/vS_01_02_00"',
    );
    expect(xml).toMatch(/<evtExpRisco Id="ID1/);
  });

  it('should include ideVinculo', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<ideVinculo>');
    expect(xml).toContain('<cpfTrab>12345678909</cpfTrab>');
    expect(xml).toContain('<matricula>EMP001</matricula>');
  });

  it('should include infoExpRisco with dtIniCondicao', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<infoExpRisco>');
    expect(xml).toContain('<dtIniCondicao>2026-01-15</dtIniCondicao>');
  });

  it('should include infoAmb', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<infoAmb>');
    expect(xml).toContain('<codAmb>PROD-01</codAmb>');
    expect(xml).toContain(
      '<dscSetor>Linha de Produ',
    );
  });

  it('should include fatRisco with all fields', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<fatRisco>');
    expect(xml).toContain('<codFatRis>02.01.001</codFatRis>');
    expect(xml).toContain('<dscFatRis>Ru');
    expect(xml).toContain('<tpAval>2</tpAval>');
    expect(xml).toContain('<intConc>85</intConc>');
    expect(xml).toContain('<limTol>85</limTol>');
    expect(xml).toContain('<unMed>1</unMed>');
    expect(xml).toContain('<tecMedicao>Dosimetria</tecMedicao>');
    expect(xml).toContain('<insalubridade>S</insalubridade>');
    expect(xml).toContain('<periculosidade>N</periculosidade>');
    expect(xml).toContain('<aposentEsp>3</aposentEsp>');
  });

  it('should handle multiple fatRisco entries', () => {
    const input: S2240Input = {
      ...baseInput,
      fatRisco: [
        {
          codFatRis: '02.01.001',
          dscFatRis: 'Ruído contínuo',
          tpAval: 2,
          intConc: 85,
        },
        {
          codFatRis: '01.18.001',
          dscFatRis: 'Poeira mineral',
          tpAval: 1,
          insalubridade: 'S',
        },
      ],
    };
    const xml = builder.build(input);

    expect(xml).toContain('<codFatRis>02.01.001</codFatRis>');
    expect(xml).toContain('<codFatRis>01.18.001</codFatRis>');
  });

  it('should include epc when provided', () => {
    const input: S2240Input = {
      ...baseInput,
      epc: {
        utilizEPC: 'S',
        dscEpc: 'Enclausuramento acústico',
        eficEpc: 'S',
      },
    };
    const xml = builder.build(input);

    expect(xml).toContain('<epc>');
    expect(xml).toContain('<utilizEPC>S</utilizEPC>');
    expect(xml).toContain('<dscEpc>Enclausuramento ac');
    expect(xml).toContain('<eficEpc>S</eficEpc>');
  });

  it('should include epi when provided', () => {
    const input: S2240Input = {
      ...baseInput,
      epi: {
        utilizEPI: 'S',
        dscEpi: 'Protetor auricular tipo concha',
        eficEpi: 'S',
        caEPI: '12345',
      },
    };
    const xml = builder.build(input);

    expect(xml).toContain('<epi>');
    expect(xml).toContain('<utilizEPI>S</utilizEPI>');
    expect(xml).toContain('<dscEpi>Protetor auricular');
    expect(xml).toContain('<eficEpi>S</eficEpi>');
    expect(xml).toContain('<caEPI>12345</caEPI>');
  });

  it('should include respReg when provided', () => {
    const input: S2240Input = {
      ...baseInput,
      respReg: {
        cpfResp: '98765432100',
        nmResp: 'Dr. Roberto Lima',
        nrCRM: '789012',
        ufCRM: 'MG',
      },
    };
    const xml = builder.build(input);

    expect(xml).toContain('<respReg>');
    expect(xml).toContain('<cpfResp>98765432100</cpfResp>');
    expect(xml).toContain('<nmResp>Dr. Roberto Lima</nmResp>');
    expect(xml).toContain('<nrCRM>789012</nrCRM>');
    expect(xml).toContain('<ufCRM>MG</ufCRM>');
  });

  it('should omit optional sections when not provided', () => {
    const xml = builder.build(baseInput);

    expect(xml).not.toContain('<epc>');
    expect(xml).not.toContain('<epi>');
    expect(xml).not.toContain('<respReg>');
  });

  it('should handle fatRisco with only required fields', () => {
    const input: S2240Input = {
      ...baseInput,
      fatRisco: [{ codFatRis: '09.01.001' }],
    };
    const xml = builder.build(input);

    expect(xml).toContain('<codFatRis>09.01.001</codFatRis>');
    expect(xml).not.toContain('<dscFatRis>');
    expect(xml).not.toContain('<tpAval>');
  });

  it('should support retificacao', () => {
    const input: S2240Input = {
      ...baseInput,
      indRetif: 2,
      nrRecibo: 'REC-2240-001',
    };
    const xml = builder.build(input);

    expect(xml).toContain('<indRetif>2</indRetif>');
    expect(xml).toContain('<nrRecibo>REC-2240-001</nrRecibo>');
  });
});
