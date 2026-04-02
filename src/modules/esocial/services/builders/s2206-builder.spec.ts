import { describe, it, expect } from 'vitest';
import { S2206Builder } from './s2206-builder';
import type { S2206Input } from './s2206-builder';

describe('S2206Builder', () => {
  const builder = new S2206Builder();

  const baseInput: S2206Input = {
    tpInsc: 1,
    nrInsc: '12345678000195',
    cpfTrab: '12345678909',
    matricula: 'EMP001',
    dtAlteracao: new Date('2026-05-01'),
    nmCargo: 'Analista Sênior',
    CBOCargo: '212405',
    vrSalFx: 10000,
    undSalFixo: 5,
    tpContr: 1,
    qtdHrsSem: 44,
    tpJornada: 2,
  };

  it('should generate valid S-2206 XML with correct namespace', () => {
    const xml = builder.build(baseInput);

    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(xml).toContain(
      'xmlns="http://www.esocial.gov.br/schema/evt/evtAltContratual/vS_01_02_00"',
    );
    expect(xml).toMatch(/<evtAltContratual Id="ID1/);
  });

  it('should include ideVinculo with CPF and matricula', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<ideVinculo>');
    expect(xml).toContain('<cpfTrab>12345678909</cpfTrab>');
    expect(xml).toContain('<matricula>EMP001</matricula>');
  });

  it('should include altContratual with dtAlteracao', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<altContratual>');
    expect(xml).toContain('<dtAlteracao>2026-05-01</dtAlteracao>');
  });

  it('should include full infoContrato snapshot', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<infoContrato>');
    expect(xml).toContain('<nmCargo>Analista Sênior</nmCargo>');
    expect(xml).toContain('<CBOCargo>212405</CBOCargo>');
    expect(xml).toContain('<vrSalFx>10000.00</vrSalFx>');
    expect(xml).toContain('<undSalFixo>5</undSalFixo>');
    expect(xml).toContain('<tpContr>1</tpContr>');
  });

  it('should include horContratual', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<horContratual>');
    expect(xml).toContain('<qtdHrsSem>44</qtdHrsSem>');
    expect(xml).toContain('<tpJornada>2</tpJornada>');
  });

  it('should include localTrabalho', () => {
    const xml = builder.build(baseInput);
    expect(xml).toContain('<localTrabalho>');
    expect(xml).toContain('<localTrabGeral>');
  });

  it('should include dtTerm for fixed-term contract changes', () => {
    const input: S2206Input = {
      ...baseInput,
      tpContr: 2,
      dtTerm: new Date('2027-04-30'),
    };
    const xml = builder.build(input);
    expect(xml).toContain('<dtTerm>2027-04-30</dtTerm>');
  });

  it('should support retificacao', () => {
    const input: S2206Input = {
      ...baseInput,
      indRetif: 2,
      nrRecibo: 'REC-2206-001',
    };
    const xml = builder.build(input);
    expect(xml).toContain('<indRetif>2</indRetif>');
    expect(xml).toContain('<nrRecibo>REC-2206-001</nrRecibo>');
  });

  it('should use custom localTrabCnpj when provided', () => {
    const input: S2206Input = {
      ...baseInput,
      localTrabCnpj: '99887766000100',
    };
    const xml = builder.build(input);
    const match = xml.match(/<localTrabGeral>.*?<nrInsc>(\d+)<\/nrInsc>/s);
    expect(match).not.toBeNull();
    expect(match![1]).toBe('99887766000100');
  });
});
