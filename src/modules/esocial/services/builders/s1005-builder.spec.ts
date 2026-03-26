import { describe, it, expect } from 'vitest';
import { S1005Builder } from './s1005-builder';
import type { S1005Input } from './s1005-builder';

describe('S1005Builder', () => {
  const builder = new S1005Builder();

  const baseInput: S1005Input = {
    tpInsc: 1,
    nrInsc: '12345678000195',
    tpInscEstab: 1,
    nrInscEstab: '12345678000195',
    iniValid: '2026-01',
    cnaePrep: '6201500',
    endereco: {
      tpLograd: 'R',
      dscLograd: 'Rua das Flores',
      nrLograd: '100',
      complemento: 'Sala 201',
      bairro: 'Centro',
      cep: '01001-000',
      codMunic: '3550308',
      uf: 'SP',
    },
  };

  it('should generate valid S-1005 XML with correct namespace', () => {
    const xml = builder.build(baseInput);

    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(xml).toContain(
      'xmlns="http://www.esocial.gov.br/schema/evt/evtTabEstab/vS_01_02_00"',
    );
    expect(xml).toMatch(/<evtTabEstab Id="ID1/);
  });

  it('should include ideEvento with defaults', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<indRetif>1</indRetif>');
    expect(xml).toContain('<tpAmb>2</tpAmb>');
    expect(xml).toContain('<procEmi>1</procEmi>');
    expect(xml).toContain('<verProc>OpenSea-1.0</verProc>');
  });

  it('should include ideEmpregador with formatted CNPJ', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<tpInsc>1</tpInsc>');
    expect(xml).toContain('<nrInsc>12345678000195</nrInsc>');
  });

  it('should include ideEstab with establishment data and idePeriodo', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<ideEstab>');
    expect(xml).toContain('<iniValid>2026-01</iniValid>');
    expect(xml).not.toContain('<fimValid>');
  });

  it('should include fimValid when provided', () => {
    const input: S1005Input = {
      ...baseInput,
      fimValid: '2026-12',
    };
    const xml = builder.build(input);

    expect(xml).toContain('<fimValid>2026-12</fimValid>');
  });

  it('should include dadosEstab with CNAE', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<cnaePrep>6201500</cnaePrep>');
  });

  it('should include endereco with formatted CEP', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<tpLograd>R</tpLograd>');
    expect(xml).toContain('<dscLograd>Rua das Flores</dscLograd>');
    expect(xml).toContain('<nrLograd>100</nrLograd>');
    expect(xml).toContain('<complemento>Sala 201</complemento>');
    expect(xml).toContain('<bairro>Centro</bairro>');
    expect(xml).toContain('<cep>01001000</cep>');
    expect(xml).toContain('<codMunic>3550308</codMunic>');
    expect(xml).toContain('<uf>SP</uf>');
  });

  it('should wrap endereco in brasil group', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<endereco><brasil>');
  });

  it('should include aliqGilrat when FAP and RAT are provided', () => {
    const input: S1005Input = {
      ...baseInput,
      fap: 1.5,
      aliqRat: 2,
    };
    const xml = builder.build(input);

    expect(xml).toContain('<aliqGilrat>');
    expect(xml).toContain('<aliqRat>2</aliqRat>');
    expect(xml).toContain('<fap>1.5000</fap>');
  });

  it('should include contato block when provided', () => {
    const input: S1005Input = {
      ...baseInput,
      contato: {
        fonePrinc: '11999998888',
        emailPrinc: 'filial@empresa.com.br',
      },
    };
    const xml = builder.build(input);

    expect(xml).toContain('<fonePrinc>11999998888</fonePrinc>');
    expect(xml).toContain('<emailPrinc>filial@empresa.com.br</emailPrinc>');
  });

  it('should support retificacao mode', () => {
    const input: S1005Input = {
      ...baseInput,
      indRetif: 2,
      nrRecibo: 'REC-S1005-001',
    };
    const xml = builder.build(input);

    expect(xml).toContain('<indRetif>2</indRetif>');
    expect(xml).toContain('<nrRecibo>REC-S1005-001</nrRecibo>');
  });

  it('should wrap content in inclusao > infoEstab hierarchy', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<infoEstab>');
    expect(xml).toContain('<inclusao>');
    expect(xml).toContain('<dadosEstab>');
  });

  it('should handle address without optional fields', () => {
    const input: S1005Input = {
      ...baseInput,
      endereco: {
        dscLograd: 'Avenida Principal',
        nrLograd: '500',
        cep: '20000000',
        codMunic: '3304557',
        uf: 'RJ',
      },
    };
    const xml = builder.build(input);

    expect(xml).toContain('<dscLograd>Avenida Principal</dscLograd>');
    expect(xml).not.toContain('<tpLograd>');
    expect(xml).not.toContain('<complemento>');
    expect(xml).not.toContain('<bairro>');
  });
});
