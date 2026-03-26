import { describe, it, expect } from 'vitest';
import { S5003Parser } from './s5003-parser';

describe('S5003Parser', () => {
  const parser = new S5003Parser();

  const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtFGTS/vS_01_02_00">
  <evtFGTS>
    <ideTrabalhador>
      <cpfTrab>12345678909</cpfTrab>
    </ideTrabalhador>
    <infoFGTS>
      <dtVenc>2026-04-07</dtVenc>
      <infoFGTSEstab>
        <tpInsc>1</tpInsc>
        <nrInsc>12345678000195</nrInsc>
        <codLotacao>LOT001</codLotacao>
        <codCateg>101</codCateg>
        <dtAdm>2024-01-15</dtAdm>
        <infoBasePerApur>
          <tpValor>11</tpValor>
          <vrBcFGTS>5000.00</vrBcFGTS>
          <vrBcFGTS13>0.00</vrBcFGTS13>
        </infoBasePerApur>
        <infoBasePerApur>
          <tpValor>12</tpValor>
          <vrBcFGTS>340.91</vrBcFGTS>
          <vrBcFGTS13>2500.00</vrBcFGTS13>
        </infoBasePerApur>
      </infoFGTSEstab>
    </infoFGTS>
  </evtFGTS>
</eSocial>`;

  it('should have correct eventType', () => {
    expect(parser.eventType).toBe('S-5003');
  });

  it('should extract cpfTrab', () => {
    const output = parser.parse(sampleXml);
    expect(output.cpfTrab).toBe('12345678909');
  });

  it('should extract infoFGTS with dtVenc', () => {
    const output = parser.parse(sampleXml);

    expect(output.infoFGTS).not.toBeNull();
    expect(output.infoFGTS!.dtVenc).toBe('2026-04-07');
  });

  it('should extract infoFGTSEstab with establishment data', () => {
    const output = parser.parse(sampleXml);
    const estab = output.infoFGTS!.infoFGTSEstab;

    expect(estab).toHaveLength(1);
    expect(estab[0].tpInsc).toBe(1);
    expect(estab[0].nrInsc).toBe('12345678000195');
    expect(estab[0].codLotacao).toBe('LOT001');
    expect(estab[0].codCateg).toBe(101);
    expect(estab[0].dtAdm).toBe('2024-01-15');
  });

  it('should extract multiple infoBasePerApur entries', () => {
    const output = parser.parse(sampleXml);
    const bases = output.infoFGTS!.infoFGTSEstab[0].infoBasePerApur;

    expect(bases).toHaveLength(2);
    expect(bases[0].tpValor).toBe(11);
    expect(bases[0].vrBcFGTS).toBe(5000.0);
    expect(bases[0].vrBcFGTS13).toBe(0);
    expect(bases[1].tpValor).toBe(12);
    expect(bases[1].vrBcFGTS).toBe(340.91);
    expect(bases[1].vrBcFGTS13).toBe(2500.0);
  });

  it('should return null infoFGTS when missing', () => {
    const minimalXml = `<cpfTrab>99988877766</cpfTrab>`;
    const output = parser.parse(minimalXml);

    expect(output.cpfTrab).toBe('99988877766');
    expect(output.infoFGTS).toBeNull();
  });

  it('should handle missing dtAdm and dtVenc', () => {
    const noDatesXml = `
      <cpfTrab>12345678909</cpfTrab>
      <infoFGTS>
        <infoFGTSEstab>
          <tpInsc>1</tpInsc>
          <nrInsc>12345678000195</nrInsc>
          <codLotacao>LOT001</codLotacao>
          <codCateg>101</codCateg>
        </infoFGTSEstab>
      </infoFGTS>`;

    const output = parser.parse(noDatesXml);

    expect(output.infoFGTS!.dtVenc).toBeNull();
    expect(output.infoFGTS!.infoFGTSEstab[0].dtAdm).toBeNull();
    expect(output.infoFGTS!.infoFGTSEstab[0].infoBasePerApur).toEqual([]);
  });
});
