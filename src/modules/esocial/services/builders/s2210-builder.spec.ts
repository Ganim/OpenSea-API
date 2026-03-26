import { describe, it, expect } from 'vitest';
import { S2210Builder } from './s2210-builder';
import type { S2210Input } from './s2210-builder';

describe('S2210Builder', () => {
  const builder = new S2210Builder();

  const baseInput: S2210Input = {
    tpInsc: 1,
    nrInsc: '12345678000195',
    cpfTrab: '12345678909',
    matricula: 'EMP001',
    dtAcid: new Date('2026-05-15'),
    hrAcid: '14:30',
    tpAcid: 1,
    tpCat: 1,
    codSitGeradora: '200014000',
    codCID: 'S62',
    parteAtingida: {
      codParteAting: '753010200',
      lateralidade: 2,
    },
    agenteCausador: {
      codAgntCausador: '302010300',
    },
  };

  it('should generate valid S-2210 XML with correct namespace', () => {
    const xml = builder.build(baseInput);

    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(xml).toContain(
      'xmlns="http://www.esocial.gov.br/schema/evt/evtCAT/vS_01_02_00"',
    );
    expect(xml).toMatch(/<evtCAT Id="ID1/);
  });

  it('should include ideVinculo', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<ideVinculo>');
    expect(xml).toContain('<cpfTrab>12345678909</cpfTrab>');
    expect(xml).toContain('<matricula>EMP001</matricula>');
  });

  it('should include CAT core fields', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<cat>');
    expect(xml).toContain('<dtAcid>2026-05-15</dtAcid>');
    expect(xml).toContain('<hrAcid>14:30</hrAcid>');
    expect(xml).toContain('<tpAcid>1</tpAcid>');
    expect(xml).toContain('<tpCat>1</tpCat>');
    expect(xml).toContain('<codSitGeradora>200014000</codSitGeradora>');
    expect(xml).toContain('<codCID>S62</codCID>');
  });

  it('should include parteAtingida', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<parteAtingida>');
    expect(xml).toContain('<codParteAting>753010200</codParteAting>');
    expect(xml).toContain('<lateralidade>2</lateralidade>');
  });

  it('should include agenteCausador', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<agenteCausador>');
    expect(xml).toContain('<codAgntCausador>302010300</codAgntCausador>');
  });

  it('should include ideLocalAcid when provided', () => {
    const input: S2210Input = {
      ...baseInput,
      ideLocalAcid: {
        tpLocal: 1,
        dscLocal: 'Linha de produção',
        dscLograd: 'Rua Industrial',
        nrLograd: '500',
        bairro: 'Distrito Industrial',
        cep: '13000100',
        codMunic: '3509502',
        uf: 'SP',
      },
    };
    const xml = builder.build(input);

    expect(xml).toContain('<ideLocalAcid>');
    expect(xml).toContain('<tpLocal>1</tpLocal>');
    expect(xml).toContain('<dscLocal>Linha de produ');
    expect(xml).toContain('<dscLograd>Rua Industrial</dscLograd>');
    expect(xml).toContain('<nrLograd>500</nrLograd>');
    expect(xml).toContain('<cep>13000100</cep>');
    expect(xml).toContain('<uf>SP</uf>');
    expect(xml).toContain('<pais>105</pais>');
  });

  it('should include atestado when provided', () => {
    const input: S2210Input = {
      ...baseInput,
      atestado: {
        dtAtend: new Date('2026-05-15'),
        hrAtend: '15:00',
        indInternacao: 'N',
        durTrat: 15,
        indAfast: 'S',
        dscLesao: 'Fratura no dedo indicador',
        codCID: 'S62',
        nmMedico: 'Dr. Carlos Souza',
        nrCRM: '123456',
        ufCRM: 'SP',
      },
    };
    const xml = builder.build(input);

    expect(xml).toContain('<atestado>');
    expect(xml).toContain('<dtAtend>2026-05-15</dtAtend>');
    expect(xml).toContain('<hrAtend>15:00</hrAtend>');
    expect(xml).toContain('<indInternacao>N</indInternacao>');
    expect(xml).toContain('<durTrat>15</durTrat>');
    expect(xml).toContain('<indAfast>S</indAfast>');
    expect(xml).toContain('<nmMedico>Dr. Carlos Souza</nmMedico>');
    expect(xml).toContain('<nrCRM>123456</nrCRM>');
    expect(xml).toContain('<ufCRM>SP</ufCRM>');
  });

  it('should omit optional fields when not provided', () => {
    const minimalInput: S2210Input = {
      tpInsc: 1,
      nrInsc: '12345678000195',
      cpfTrab: '12345678909',
      matricula: 'EMP001',
      dtAcid: new Date('2026-05-15'),
      tpAcid: 1,
      tpCat: 1,
      codSitGeradora: '200014000',
      codCID: 'S62',
      parteAtingida: { codParteAting: '753010200', lateralidade: 2 },
      agenteCausador: { codAgntCausador: '302010300' },
    };
    const xml = builder.build(minimalInput);

    expect(xml).not.toContain('<hrAcid>');
    expect(xml).not.toContain('<ideLocalAcid>');
    expect(xml).not.toContain('<atestado>');
    expect(xml).not.toContain('<nrOrdCAT>');
    expect(xml).not.toContain('<dscLesao>');
  });

  it('should include nrOrdCAT for reabertura CAT', () => {
    const input: S2210Input = {
      ...baseInput,
      tpCat: 2,
      nrOrdCAT: 'CAT-2026-001',
    };
    const xml = builder.build(input);

    expect(xml).toContain('<tpCat>2</tpCat>');
    expect(xml).toContain('<nrOrdCAT>CAT-2026-001</nrOrdCAT>');
  });

  it('should support retificacao', () => {
    const input: S2210Input = {
      ...baseInput,
      indRetif: 2,
      nrRecibo: 'REC-2210-001',
    };
    const xml = builder.build(input);

    expect(xml).toContain('<indRetif>2</indRetif>');
    expect(xml).toContain('<nrRecibo>REC-2210-001</nrRecibo>');
  });
});
