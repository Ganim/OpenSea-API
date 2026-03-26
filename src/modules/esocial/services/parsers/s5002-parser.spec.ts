import { describe, it, expect } from 'vitest';
import { S5002Parser } from './s5002-parser';

describe('S5002Parser', () => {
  const parser = new S5002Parser();

  const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtIRRF/vS_01_02_00">
  <evtIRRF>
    <ideEvento>
      <perApur>2026-03</perApur>
    </ideEvento>
    <ideTrabalhador>
      <cpfTrab>12345678909</cpfTrab>
    </ideTrabalhador>
    <infoIRComplem>
      <dtLaudo>2026-01-15</dtLaudo>
      <infoDep>
        <vrDedDep>189.59</vrDedDep>
      </infoDep>
    </infoIRComplem>
    <ideEstabLot>
      <tpInsc>1</tpInsc>
      <nrInsc>12345678000195</nrInsc>
      <codLotacao>LOT001</codLotacao>
      <codCateg>101</codCateg>
      <infoIR>
        <codCR>056101</codCR>
        <vrBcIRRF>4500.00</vrBcIRRF>
        <vrIRRF>320.75</vrIRRF>
        <descCR>IRRF sobre salario</descCR>
      </infoIR>
      <infoIR>
        <codCR>056102</codCR>
        <vrBcIRRF>2500.00</vrBcIRRF>
        <vrIRRF>150.00</vrIRRF>
      </infoIR>
    </ideEstabLot>
  </evtIRRF>
</eSocial>`;

  it('should have correct eventType', () => {
    expect(parser.eventType).toBe('S-5002');
  });

  it('should extract cpfTrab', () => {
    const output = parser.parse(sampleXml);
    expect(output.cpfTrab).toBe('12345678909');
  });

  it('should extract infoIRComplem with dtLaudo', () => {
    const output = parser.parse(sampleXml);

    expect(output.infoIRComplem).not.toBeNull();
    expect(output.infoIRComplem!.dtLaudo).toBe('2026-01-15');
  });

  it('should extract infoDep with deduction value', () => {
    const output = parser.parse(sampleXml);

    expect(output.infoIRComplem!.infoDep).not.toBeNull();
    expect(output.infoIRComplem!.infoDep!.vrDedDep).toBe(189.59);
  });

  it('should extract ideEstabLot with establishment data', () => {
    const output = parser.parse(sampleXml);

    expect(output.ideEstabLot).toHaveLength(1);
    expect(output.ideEstabLot[0].tpInsc).toBe(1);
    expect(output.ideEstabLot[0].nrInsc).toBe('12345678000195');
    expect(output.ideEstabLot[0].codLotacao).toBe('LOT001');
    expect(output.ideEstabLot[0].codCateg).toBe(101);
  });

  it('should extract multiple infoIR entries', () => {
    const output = parser.parse(sampleXml);
    const infoIRItems = output.ideEstabLot[0].infoIR;

    expect(infoIRItems).toHaveLength(2);
    expect(infoIRItems[0].codCR).toBe('056101');
    expect(infoIRItems[0].vrBcIRRF).toBe(4500.0);
    expect(infoIRItems[0].vrIRRF).toBe(320.75);
    expect(infoIRItems[0].descCR).toBe('IRRF sobre salario');
    expect(infoIRItems[1].codCR).toBe('056102');
    expect(infoIRItems[1].descCR).toBeNull();
  });

  it('should return null for infoIRComplem when missing', () => {
    const minimalXml = `<cpfTrab>99988877766</cpfTrab>`;
    const output = parser.parse(minimalXml);

    expect(output.cpfTrab).toBe('99988877766');
    expect(output.infoIRComplem).toBeNull();
    expect(output.ideEstabLot).toEqual([]);
  });

  it('should handle missing infoDep within infoIRComplem', () => {
    const noDepsXml = `
      <cpfTrab>12345678909</cpfTrab>
      <infoIRComplem>
        <dtLaudo>2026-02-01</dtLaudo>
      </infoIRComplem>`;

    const output = parser.parse(noDepsXml);

    expect(output.infoIRComplem).not.toBeNull();
    expect(output.infoIRComplem!.dtLaudo).toBe('2026-02-01');
    expect(output.infoIRComplem!.infoDep).toBeNull();
  });
});
