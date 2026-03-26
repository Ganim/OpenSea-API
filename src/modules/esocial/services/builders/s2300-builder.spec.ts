import { describe, it, expect } from 'vitest';
import { S2300Builder } from './s2300-builder';
import type { S2300Input } from './s2300-builder';

describe('S2300Builder', () => {
  const builder = new S2300Builder();

  const baseInput: S2300Input = {
    tpInsc: 1,
    nrInsc: '12345678000195',
    cpfTrab: '12345678909',
    nmTrab: 'João Diretor',
    sexo: 'M',
    racaCor: 1,
    dtNascto: new Date('1980-03-20'),
    codCateg: 721,
    dtInicio: new Date('2026-01-01'),
    natAtividade: 1,
    nmCargo: 'Diretor Financeiro',
    CBOCargo: '123105',
    vrSalFx: 15000,
    undSalFixo: 5,
  };

  it('should generate valid S-2300 XML with correct namespace', () => {
    const xml = builder.build(baseInput);

    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(xml).toContain(
      'xmlns="http://www.esocial.gov.br/schema/evt/evtTSVInicio/vS_01_02_00"',
    );
    expect(xml).toMatch(/<evtTSVInicio Id="ID1/);
  });

  it('should include trabalhador with personal data', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<trabalhador>');
    expect(xml).toContain('<cpfTrab>12345678909</cpfTrab>');
    expect(xml).toContain('<nmTrab>Jo');
    expect(xml).toContain('<sexo>M</sexo>');
    expect(xml).toContain('<racaCor>1</racaCor>');
    expect(xml).toContain('<dtNascto>1980-03-20</dtNascto>');
  });

  it('should include infoTSVInicio with core fields', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<infoTSVInicio>');
    expect(xml).toContain('<codCateg>721</codCateg>');
    expect(xml).toContain('<dtInicio>2026-01-01</dtInicio>');
    expect(xml).toContain('<natAtividade>1</natAtividade>');
  });

  it('should include infoCargo when provided', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<infoCargo>');
    expect(xml).toContain('<nmCargo>Diretor Financeiro</nmCargo>');
    expect(xml).toContain('<CBOCargo>123105</CBOCargo>');
  });

  it('should include remuneracao when vrSalFx is provided', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<remuneracao>');
    expect(xml).toContain('<vrSalFx>15000.00</vrSalFx>');
    expect(xml).toContain('<undSalFixo>5</undSalFixo>');
  });

  it('should include endereco when provided', () => {
    const input: S2300Input = {
      ...baseInput,
      endereco: {
        tpLograd: 'AV',
        dscLograd: 'Av. Paulista',
        nrLograd: '1000',
        bairro: 'Bela Vista',
        cep: '01310100',
        uf: 'SP',
      },
    };
    const xml = builder.build(input);

    expect(xml).toContain('<endereco>');
    expect(xml).toContain('<brasil>');
    expect(xml).toContain('<tpLograd>AV</tpLograd>');
    expect(xml).toContain('<dscLograd>Av. Paulista</dscLograd>');
    expect(xml).toContain('<cep>01310100</cep>');
  });

  it('should include dependentes when provided', () => {
    const input: S2300Input = {
      ...baseInput,
      dependentes: [
        {
          tpDep: '03',
          nmDep: 'Maria Filha',
          dtNascDep: new Date('2010-08-15'),
          cpfDep: '11122233344',
          depIRRF: 'S',
          depSF: 'S',
        },
      ],
    };
    const xml = builder.build(input);

    expect(xml).toContain('<dependente>');
    expect(xml).toContain('<tpDep>03</tpDep>');
    expect(xml).toContain('<nmDep>Maria Filha</nmDep>');
    expect(xml).toContain('<dtNascDep>2010-08-15</dtNascDep>');
    expect(xml).toContain('<cpfDep>11122233344</cpfDep>');
    expect(xml).toContain('<depIRRF>S</depIRRF>');
    expect(xml).toContain('<depSF>S</depSF>');
  });

  it('should omit optional sections when not provided', () => {
    const minimalInput: S2300Input = {
      tpInsc: 1,
      nrInsc: '12345678000195',
      cpfTrab: '12345678909',
      nmTrab: 'João Estagiário',
      sexo: 'M',
      racaCor: 1,
      dtNascto: new Date('2000-01-01'),
      codCateg: 901,
      dtInicio: new Date('2026-06-01'),
    };
    const xml = builder.build(minimalInput);

    expect(xml).not.toContain('<endereco>');
    expect(xml).not.toContain('<dependente>');
    expect(xml).not.toContain('<infoCargo>');
    expect(xml).not.toContain('<remuneracao>');
    expect(xml).not.toContain('<natAtividade>');
  });

  it('should default undSalFixo to 5 (Mês) when not specified', () => {
    const input: S2300Input = {
      ...baseInput,
      vrSalFx: 8000,
      undSalFixo: undefined,
    };
    const xml = builder.build(input);

    expect(xml).toContain('<undSalFixo>5</undSalFixo>');
  });

  it('should support retificacao', () => {
    const input: S2300Input = {
      ...baseInput,
      indRetif: 2,
      nrRecibo: 'REC-2300-001',
    };
    const xml = builder.build(input);

    expect(xml).toContain('<indRetif>2</indRetif>');
    expect(xml).toContain('<nrRecibo>REC-2300-001</nrRecibo>');
  });
});
