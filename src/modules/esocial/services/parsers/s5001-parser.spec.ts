import { describe, it, expect } from 'vitest';
import { S5001Parser } from './s5001-parser';

describe('S5001Parser', () => {
  const parser = new S5001Parser();

  const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtCS/vS_01_02_00">
  <evtCS>
    <ideEvento>
      <perApur>2026-03</perApur>
    </ideEvento>
    <ideEmpregador>
      <tpInsc>1</tpInsc>
      <nrInsc>12345678000195</nrInsc>
    </ideEmpregador>
    <ideTrabalhador>
      <cpfTrab>12345678909</cpfTrab>
    </ideTrabalhador>
    <infoCpCalc>
      <vrCpSeg>450.50</vrCpSeg>
      <vrDescSest>12.30</vrDescSest>
      <vrDescSenat>6.15</vrDescSenat>
      <vrSalFam>50.00</vrSalFam>
    </infoCpCalc>
    <infoCp>
      <ideEstabLot>
        <tpInsc>1</tpInsc>
        <nrInsc>12345678000195</nrInsc>
        <codLotacao>LOT001</codLotacao>
        <infoCategInc>
          <matricula>MAT-001</matricula>
          <codCateg>101</codCateg>
          <indSimples>1</indSimples>
          <infoBaseCS>
            <ind13>0</ind13>
            <tpValor>11</tpValor>
            <valor>5000.00</valor>
          </infoBaseCS>
          <infoBaseCS>
            <ind13>1</ind13>
            <tpValor>12</tpValor>
            <valor>2500.00</valor>
          </infoBaseCS>
        </infoCategInc>
      </ideEstabLot>
    </infoCp>
  </evtCS>
</eSocial>`;

  it('should have correct eventType', () => {
    expect(parser.eventType).toBe('S-5001');
  });

  it('should extract cpfTrab', () => {
    const output = parser.parse(sampleXml);
    expect(output.cpfTrab).toBe('12345678909');
  });

  it('should extract infoCpCalc values', () => {
    const output = parser.parse(sampleXml);

    expect(output.infoCpCalc.vrCpSeg).toBe(450.5);
    expect(output.infoCpCalc.vrDescSest).toBe(12.3);
    expect(output.infoCpCalc.vrDescSenat).toBe(6.15);
    expect(output.infoCpCalc.vrSalFam).toBe(50.0);
  });

  it('should extract ideEstabLot with establishment data', () => {
    const output = parser.parse(sampleXml);

    expect(output.ideEstabLot).toHaveLength(1);
    expect(output.ideEstabLot[0].tpInsc).toBe(1);
    expect(output.ideEstabLot[0].nrInsc).toBe('12345678000195');
    expect(output.ideEstabLot[0].codLotacao).toBe('LOT001');
  });

  it('should extract infoCategInc with category data', () => {
    const output = parser.parse(sampleXml);
    const categInc = output.ideEstabLot[0].infoCategInc;

    expect(categInc).toHaveLength(1);
    expect(categInc[0].matricula).toBe('MAT-001');
    expect(categInc[0].codCateg).toBe(101);
    expect(categInc[0].indSimples).toBe('1');
  });

  it('should extract multiple infoBaseCS entries', () => {
    const output = parser.parse(sampleXml);
    const baseCS = output.ideEstabLot[0].infoCategInc[0].infoBaseCS;

    expect(baseCS).toHaveLength(2);
    expect(baseCS[0].ind13).toBe(0);
    expect(baseCS[0].tpValor).toBe(11);
    expect(baseCS[0].valor).toBe(5000.0);
    expect(baseCS[1].ind13).toBe(1);
    expect(baseCS[1].tpValor).toBe(12);
    expect(baseCS[1].valor).toBe(2500.0);
  });

  it('should handle missing infoCpCalc gracefully with defaults', () => {
    const minimalXml = `<evtCS><cpfTrab>99988877766</cpfTrab></evtCS>`;
    const output = parser.parse(minimalXml);

    expect(output.cpfTrab).toBe('99988877766');
    expect(output.infoCpCalc.vrCpSeg).toBe(0);
    expect(output.infoCpCalc.vrDescSest).toBe(0);
    expect(output.ideEstabLot).toEqual([]);
  });

  it('should handle multiple ideEstabLot entries', () => {
    const multiEstabXml = `
      <cpfTrab>12345678909</cpfTrab>
      <infoCpCalc>
        <vrCpSeg>500</vrCpSeg>
        <vrDescSest>0</vrDescSest>
        <vrDescSenat>0</vrDescSenat>
        <vrSalFam>0</vrSalFam>
      </infoCpCalc>
      <ideEstabLot>
        <tpInsc>1</tpInsc>
        <nrInsc>11111111000111</nrInsc>
        <codLotacao>LOT-A</codLotacao>
      </ideEstabLot>
      <ideEstabLot>
        <tpInsc>1</tpInsc>
        <nrInsc>22222222000222</nrInsc>
        <codLotacao>LOT-B</codLotacao>
      </ideEstabLot>`;

    const output = parser.parse(multiEstabXml);

    expect(output.ideEstabLot).toHaveLength(2);
    expect(output.ideEstabLot[0].codLotacao).toBe('LOT-A');
    expect(output.ideEstabLot[1].codLotacao).toBe('LOT-B');
  });
});
