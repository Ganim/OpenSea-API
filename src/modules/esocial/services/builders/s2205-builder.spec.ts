import { describe, it, expect } from 'vitest';
import { S2205Builder } from './s2205-builder';
import type { S2205Input } from './s2205-builder';

describe('S2205Builder', () => {
  const builder = new S2205Builder();

  const baseInput: S2205Input = {
    tpInsc: 1,
    nrInsc: '12345678000195',
    cpfTrab: '12345678909',
    dtAlteracao: new Date('2026-04-01'),
    nmTrab: 'Maria da Silva',
    sexo: 'F',
    racaCor: 1,
    estCiv: 2,
    grauInstr: '09',
    dtNascto: new Date('1990-06-15'),
  };

  it('should generate valid S-2205 XML with correct namespace', () => {
    const xml = builder.build(baseInput);

    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(xml).toContain(
      'xmlns="http://www.esocial.gov.br/schema/evt/evtAltCadastral/vS_01_02_00"',
    );
    expect(xml).toMatch(/<evtAltCadastral Id="ID1/);
  });

  it('should include ideTrabalhador with CPF', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<ideTrabalhador>');
    expect(xml).toContain('<cpfTrab>12345678909</cpfTrab>');
  });

  it('should include alteracao with dtAlteracao and dadosTrabalhador', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<alteracao>');
    expect(xml).toContain('<dtAlteracao>2026-04-01</dtAlteracao>');
    expect(xml).toContain('<dadosTrabalhador>');
    expect(xml).toContain('<nmTrab>Maria da Silva</nmTrab>');
    expect(xml).toContain('<sexo>F</sexo>');
    expect(xml).toContain('<racaCor>1</racaCor>');
    expect(xml).toContain('<estCiv>2</estCiv>');
    expect(xml).toContain('<grauInstr>09</grauInstr>');
    expect(xml).toContain('<dtNascto>1990-06-15</dtNascto>');
  });

  it('should include endereco when provided', () => {
    const input: S2205Input = {
      ...baseInput,
      endereco: {
        tpLograd: 'R',
        dscLograd: 'Rua das Flores',
        nrLograd: '123',
        complemento: 'Apto 45',
        bairro: 'Centro',
        cep: '01001000',
        codMunic: '3550308',
        uf: 'SP',
      },
    };
    const xml = builder.build(input);

    expect(xml).toContain('<endereco>');
    expect(xml).toContain('<brasil>');
    expect(xml).toContain('<tpLograd>R</tpLograd>');
    expect(xml).toContain('<dscLograd>Rua das Flores</dscLograd>');
    expect(xml).toContain('<nrLograd>123</nrLograd>');
    expect(xml).toContain('<complemento>Apto 45</complemento>');
    expect(xml).toContain('<bairro>Centro</bairro>');
    expect(xml).toContain('<cep>01001000</cep>');
    expect(xml).toContain('<codMunic>3550308</codMunic>');
    expect(xml).toContain('<uf>SP</uf>');
  });

  it('should include contato when provided', () => {
    const input: S2205Input = {
      ...baseInput,
      contato: {
        fonePrinc: '11999998888',
        emailPrinc: 'maria@email.com',
      },
    };
    const xml = builder.build(input);

    expect(xml).toContain('<contato>');
    expect(xml).toContain('<fonePrinc>11999998888</fonePrinc>');
    expect(xml).toContain('<emailPrinc>maria@email.com</emailPrinc>');
  });

  it('should omit endereco and contato when not provided', () => {
    const xml = builder.build(baseInput);

    expect(xml).not.toContain('<endereco>');
    expect(xml).not.toContain('<contato>');
  });

  it('should include nmSoc when provided', () => {
    const input: S2205Input = {
      ...baseInput,
      nmSoc: 'Maria Silva',
    };
    const xml = builder.build(input);

    expect(xml).toContain('<nmSoc>Maria Silva</nmSoc>');
  });

  it('should omit optional fields when not provided', () => {
    const minimalInput: S2205Input = {
      tpInsc: 1,
      nrInsc: '12345678000195',
      cpfTrab: '12345678909',
      dtAlteracao: new Date('2026-04-01'),
      nmTrab: 'Maria da Silva',
      sexo: 'F',
      racaCor: 1,
      dtNascto: new Date('1990-06-15'),
    };
    const xml = builder.build(minimalInput);

    expect(xml).not.toContain('<estCiv>');
    expect(xml).not.toContain('<grauInstr>');
    expect(xml).not.toContain('<nmSoc>');
  });

  it('should support retificacao', () => {
    const input: S2205Input = {
      ...baseInput,
      indRetif: 2,
      nrRecibo: 'REC-2205-001',
    };
    const xml = builder.build(input);

    expect(xml).toContain('<indRetif>2</indRetif>');
    expect(xml).toContain('<nrRecibo>REC-2205-001</nrRecibo>');
  });
});
