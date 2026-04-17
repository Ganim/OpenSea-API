import { describe, it, expect } from 'vitest';
import { S2200Builder } from './s2200-builder';
import type { S2200Input } from './s2200-builder';

describe('S2200Builder', () => {
  const builder = new S2200Builder();

  const baseInput: S2200Input = {
    tpInsc: 1,
    nrInsc: '12345678000195',

    cpfTrab: '12345678909',
    nmTrab: 'João da Silva',
    sexo: 'M',
    racaCor: 1,
    estCiv: 2,
    grauInstr: '09',
    paisNac: 105,

    nascimento: {
      dtNascto: new Date('1990-06-15T12:00:00Z'),
      paisNascto: 105,
      nmMunic: 'São Paulo',
      uf: 'SP',
    },

    endereco: {
      tpLograd: 'R',
      dscLograd: 'Rua das Flores',
      nrLograd: '123',
      complemento: 'Apto 1',
      bairro: 'Centro',
      cep: '01000-000',
      codMunic: '3550308',
      uf: 'SP',
    },

    dependentes: [
      {
        tpDep: '03',
        nmDep: 'Maria da Silva',
        dtNascDep: new Date('2020-01-10T12:00:00Z'),
        cpfDep: '98765432100',
        depIRRF: 'S',
        depSF: 'S',
      },
    ],

    matricula: 'EMP001',
    tpRegTrab: 1,
    tpRegPrev: 1,
    cadIni: 'S',

    celetista: {
      dtAdm: new Date('2026-04-01T12:00:00Z'),
      tpAdmissao: 1,
      indAdmissao: 1,
      natAtividade: 1,
    },

    contrato: {
      nmCargo: 'Analista de Sistemas',
      CBOCargo: '212405',
      vrSalFx: 8000,
      undSalFixo: 5,
      tpContr: 1,
      qtdHrsSem: 44,
      tpJornada: 2,
    },
  };

  it('should generate valid S-2200 XML with correct namespace', () => {
    const xml = builder.build(baseInput);

    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(xml).toContain(
      'xmlns="http://www.esocial.gov.br/schema/evt/evtAdmissao/vS_01_02_00"',
    );
    expect(xml).toMatch(/<evtAdmissao Id="ID1/);
  });

  // ---- ideEvento ----
  it('should include ideEvento block', () => {
    const xml = builder.build(baseInput);
    expect(xml).toContain('<ideEvento>');
    expect(xml).toContain('<indRetif>1</indRetif>');
    expect(xml).toContain('<tpAmb>2</tpAmb>');
    expect(xml).toContain('<verProc>OpenSea-1.0</verProc>');
  });

  // ---- ideEmpregador ----
  it('should include ideEmpregador with CNPJ', () => {
    const xml = builder.build(baseInput);
    expect(xml).toContain('<ideEmpregador>');
    expect(xml).toContain('<nrInsc>12345678000195</nrInsc>');
  });

  // ---- trabalhador ----
  it('should include trabalhador with worker data', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<trabalhador>');
    expect(xml).toContain('<cpfTrab>12345678909</cpfTrab>');
    expect(xml).toContain('<nmTrab>João da Silva</nmTrab>');
    expect(xml).toContain('<sexo>M</sexo>');
    expect(xml).toContain('<racaCor>1</racaCor>');
    expect(xml).toContain('<estCiv>2</estCiv>');
    expect(xml).toContain('<grauInstr>09</grauInstr>');
    expect(xml).toContain('<paisNac>105</paisNac>');
  });

  it('should include nascimento block', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<nascimento>');
    expect(xml).toContain('<dtNascto>1990-06-15</dtNascto>');
    expect(xml).toContain('<paisNascto>105</paisNascto>');
    expect(xml).toContain('<nmMunic>São Paulo</nmMunic>');
    expect(xml).toContain('<uf>SP</uf>');
  });

  it('should include endereco > brasil block', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<endereco>');
    expect(xml).toContain('<brasil>');
    expect(xml).toContain('<tpLograd>R</tpLograd>');
    expect(xml).toContain('<dscLograd>Rua das Flores</dscLograd>');
    expect(xml).toContain('<nrLograd>123</nrLograd>');
    expect(xml).toContain('<complemento>Apto 1</complemento>');
    expect(xml).toContain('<bairro>Centro</bairro>');
    expect(xml).toContain('<cep>01000000</cep>');
    expect(xml).toContain('<codMunic>3550308</codMunic>');
  });

  it('should include dependente block', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<dependente>');
    expect(xml).toContain('<tpDep>03</tpDep>');
    expect(xml).toContain('<nmDep>Maria da Silva</nmDep>');
    expect(xml).toContain('<dtNascDep>2020-01-10</dtNascDep>');
    expect(xml).toContain('<cpfDep>98765432100</cpfDep>');
    expect(xml).toContain('<depIRRF>S</depIRRF>');
    expect(xml).toContain('<depSF>S</depSF>');
  });

  it('should handle multiple dependentes', () => {
    const input: S2200Input = {
      ...baseInput,
      dependentes: [
        {
          tpDep: '01',
          nmDep: 'Ana Silva',
          dtNascDep: '1992-03-20',
          depIRRF: 'S',
          depSF: 'N',
        },
        {
          tpDep: '03',
          nmDep: 'Pedro Silva',
          dtNascDep: '2018-07-05',
          cpfDep: '11122233344',
          depIRRF: 'S',
          depSF: 'S',
        },
      ],
    };
    const xml = builder.build(input);

    // Both dependents should appear
    expect(xml).toContain('<nmDep>Ana Silva</nmDep>');
    expect(xml).toContain('<nmDep>Pedro Silva</nmDep>');
  });

  it('should omit endereco when not provided', () => {
    const input: S2200Input = {
      ...baseInput,
      endereco: undefined,
    };
    const xml = builder.build(input);
    expect(xml).not.toContain('<endereco>');
  });

  it('should omit dependentes when empty array', () => {
    const input: S2200Input = {
      ...baseInput,
      dependentes: [],
    };
    const xml = builder.build(input);
    expect(xml).not.toContain('<dependente>');
  });

  // ---- vinculo ----
  it('should include vinculo with matricula and regime', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<vinculo>');
    expect(xml).toContain('<matricula>EMP001</matricula>');
    expect(xml).toContain('<tpRegTrab>1</tpRegTrab>');
    expect(xml).toContain('<tpRegPrev>1</tpRegPrev>');
    expect(xml).toContain('<cadIni>S</cadIni>');
  });

  it('should include infoCeletista block', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<infoRegimeTrab>');
    expect(xml).toContain('<infoCeletista>');
    expect(xml).toContain('<dtAdm>2026-04-01</dtAdm>');
    expect(xml).toContain('<tpAdmissao>1</tpAdmissao>');
    expect(xml).toContain('<indAdmissao>1</indAdmissao>');
    expect(xml).toContain('<natAtividade>1</natAtividade>');
  });

  it('should include infoContrato block', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<infoContrato>');
    expect(xml).toContain('<nmCargo>Analista de Sistemas</nmCargo>');
    expect(xml).toContain('<CBOCargo>212405</CBOCargo>');
    expect(xml).toContain('<vrSalFx>8000.00</vrSalFx>');
    expect(xml).toContain('<undSalFixo>5</undSalFixo>');
  });

  it('should include duracao block with tpContr emitted exactly once', () => {
    const xml = builder.build(baseInput);
    expect(xml).toContain('<duracao>');
    expect(xml).toContain('<tpContr>1</tpContr>');

    // Regression: tpContr must appear exactly once in the XML (inside duracao).
    // Emitting it twice (directly under infoContrato AND inside duracao)
    // breaks eSocial XSD validation — see P0-11 ops fix.
    const occurrences = (xml.match(/<tpContr>/g) || []).length;
    expect(occurrences).toBe(1);
  });

  it('should NOT emit tpContr directly under infoContrato (only inside duracao)', () => {
    const xml = builder.build(baseInput);
    // Confirm tpContr lives inside duracao, not as a direct sibling of nmCargo.
    const directUnderInfoContrato = xml.match(
      /<undSalFixo>[^<]*<\/undSalFixo>\s*<tpContr>/,
    );
    expect(directUnderInfoContrato).toBeNull();

    const insideDuracao = xml.match(/<duracao>\s*<tpContr>/);
    expect(insideDuracao).not.toBeNull();
  });

  it('should include dtTerm in duracao for fixed-term contracts', () => {
    const input: S2200Input = {
      ...baseInput,
      contrato: {
        ...baseInput.contrato,
        tpContr: 2,
        dtTerm: new Date('2027-03-31T12:00:00Z'),
      },
    };
    const xml = builder.build(input);
    expect(xml).toContain('<dtTerm>2027-03-31</dtTerm>');
  });

  it('should include horContratual block', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<horContratual>');
    expect(xml).toContain('<qtdHrsSem>44</qtdHrsSem>');
    expect(xml).toContain('<tpJornada>2</tpJornada>');
  });

  it('should include localTrabalho with employer CNPJ by default', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<localTrabalho>');
    expect(xml).toContain('<localTrabGeral>');
    expect(xml).toContain('<nrInsc>12345678000195</nrInsc>');
  });

  it('should use localTrabCnpj when provided', () => {
    const input: S2200Input = {
      ...baseInput,
      localTrabCnpj: '99887766000100',
    };
    const xml = builder.build(input);

    // The localTrabalho should use the branch CNPJ, not the employer one
    expect(xml).toContain('<localTrabGeral>');
    // Check the nrInsc inside localTrabGeral (last one in the XML)
    const localMatch = xml.match(/<localTrabGeral>.*?<nrInsc>(\d+)<\/nrInsc>/s);
    expect(localMatch).not.toBeNull();
    expect(localMatch![1]).toBe('99887766000100');
  });

  it('should support socialName (nmSoc)', () => {
    const input: S2200Input = {
      ...baseInput,
      nmSoc: 'Nome Social',
    };
    const xml = builder.build(input);
    expect(xml).toContain('<nmSoc>Nome Social</nmSoc>');
  });

  it('should escape special characters in names', () => {
    const input: S2200Input = {
      ...baseInput,
      nmTrab: "José D'Angelo & Cia",
    };
    const xml = builder.build(input);
    expect(xml).toContain('<nmTrab>José D&apos;Angelo &amp; Cia</nmTrab>');
  });

  it('should support retificacao with nrRecibo', () => {
    const input: S2200Input = {
      ...baseInput,
      indRetif: 2,
      nrRecibo: 'REC-2200-001',
    };
    const xml = builder.build(input);
    expect(xml).toContain('<indRetif>2</indRetif>');
    expect(xml).toContain('<nrRecibo>REC-2200-001</nrRecibo>');
  });

  it('should default cadIni to S when not provided', () => {
    const input: S2200Input = {
      ...baseInput,
      cadIni: undefined,
    };
    const xml = builder.build(input);
    expect(xml).toContain('<cadIni>S</cadIni>');
  });

  it('should omit infoRegimeTrab when celetista is not provided', () => {
    const input: S2200Input = {
      ...baseInput,
      celetista: undefined,
    };
    const xml = builder.build(input);
    expect(xml).not.toContain('<infoRegimeTrab>');
    expect(xml).not.toContain('<infoCeletista>');
  });
});
