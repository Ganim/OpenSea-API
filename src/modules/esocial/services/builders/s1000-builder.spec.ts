import { describe, it, expect } from 'vitest';
import { S1000Builder } from './s1000-builder';
import type { S1000Input } from './s1000-builder';

describe('S1000Builder', () => {
  const builder = new S1000Builder();

  const baseInput: S1000Input = {
    tpInsc: 1,
    nrInsc: '12345678000195',
    iniValid: '2026-01',
    nmRazao: 'Empresa Demo Ltda',
    classTrib: '01',
    natJurid: '2062',
    cnaePrep: '6201500',
    contato: {
      fonePrinc: '11999998888',
      emailPrinc: 'contato@empresa.com.br',
    },
  };

  it('should generate valid S-1000 XML with correct namespace', () => {
    const xml = builder.build(baseInput);

    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(xml).toContain(
      'xmlns="http://www.esocial.gov.br/schema/evt/evtInfoEmpregador/vS_01_02_00"',
    );
    expect(xml).toMatch(/<evtInfoEmpregador Id="ID1/);
  });

  it('should include ideEvento with defaults (original, homologacao)', () => {
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

  it('should include idePeriodo with iniValid', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<iniValid>2026-01</iniValid>');
    expect(xml).not.toContain('<fimValid>');
  });

  it('should include fimValid when provided', () => {
    const input: S1000Input = {
      ...baseInput,
      fimValid: '2026-12',
    };
    const xml = builder.build(input);

    expect(xml).toContain('<fimValid>2026-12</fimValid>');
  });

  it('should include infoCadastro with employer details', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<nmRazao>Empresa Demo Ltda</nmRazao>');
    expect(xml).toContain('<classTrib>01</classTrib>');
    expect(xml).toContain('<natJurid>2062</natJurid>');
    expect(xml).toContain('<cnaePrep>6201500</cnaePrep>');
  });

  it('should include contato block', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<fonePrinc>11999998888</fonePrinc>');
    expect(xml).toContain('<emailPrinc>contato@empresa.com.br</emailPrinc>');
  });

  it('should include optional cooperative and construction flags', () => {
    const input: S1000Input = {
      ...baseInput,
      indCoop: 1,
      indConstr: 0,
      indDesFolha: 1,
      indOptRegEletron: 1,
    };
    const xml = builder.build(input);

    expect(xml).toContain('<indCoop>1</indCoop>');
    expect(xml).toContain('<indConstr>0</indConstr>');
    expect(xml).toContain('<indDesFolha>1</indDesFolha>');
    expect(xml).toContain('<indOptRegEletron>1</indOptRegEletron>');
  });

  it('should include softwareHouse block when provided', () => {
    const input: S1000Input = {
      ...baseInput,
      softwareHouse: {
        cnpjSoftHouse: '98765432000100',
        nmCont: 'Suporte Tecnico',
        telefone: '11888887777',
        email: 'suporte@softwarehouse.com',
      },
    };
    const xml = builder.build(input);

    expect(xml).toContain('<cnpjSoftHouse>98765432000100</cnpjSoftHouse>');
    expect(xml).toContain('<nmCont>Suporte Tecnico</nmCont>');
    expect(xml).toContain('<telefone>11888887777</telefone>');
    expect(xml).toContain('<email>suporte@softwarehouse.com</email>');
  });

  it('should support retificacao mode with receipt number', () => {
    const input: S1000Input = {
      ...baseInput,
      indRetif: 2,
      nrRecibo: 'REC-S1000-001',
    };
    const xml = builder.build(input);

    expect(xml).toContain('<indRetif>2</indRetif>');
    expect(xml).toContain('<nrRecibo>REC-S1000-001</nrRecibo>');
  });

  it('should support producao environment', () => {
    const input: S1000Input = {
      ...baseInput,
      tpAmb: 1,
    };
    const xml = builder.build(input);

    expect(xml).toContain('<tpAmb>1</tpAmb>');
  });

  it('should wrap content in inclusao > infoEmpregador hierarchy', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<infoEmpregador>');
    expect(xml).toContain('<inclusao>');
    expect(xml).toContain('<idePeriodo>');
    expect(xml).toContain('<infoCadastro>');
  });

  it('should escape special XML characters in nmRazao', () => {
    const input: S1000Input = {
      ...baseInput,
      nmRazao: 'Empresa & Filhos <Ltda>',
    };
    const xml = builder.build(input);

    expect(xml).toContain('<nmRazao>Empresa &amp; Filhos &lt;Ltda&gt;</nmRazao>');
  });
});
