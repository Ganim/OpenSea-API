import { describe, it, expect } from 'vitest';
import { S5012Parser } from './s5012-parser';

describe('S5012Parser', () => {
  const parser = new S5012Parser();

  const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtIRRFConsolidado/vS_01_02_00">
  <evtIRRFConsolidado>
    <ideEvento>
      <perApur>2026-03</perApur>
    </ideEvento>
    <infoIR>
      <nrInscEstab>12345678000195</nrInscEstab>
      <vrBcIRRF>150000.00</vrBcIRRF>
      <vrIRRF>22500.00</vrIRRF>
      <infoIRCR>
        <codCR>056101</codCR>
        <vrCR>18000.00</vrCR>
      </infoIRCR>
      <infoIRCR>
        <codCR>056102</codCR>
        <vrCR>4500.00</vrCR>
      </infoIRCR>
    </infoIR>
    <infoIR>
      <nrInscEstab>98765432000100</nrInscEstab>
      <vrBcIRRF>80000.00</vrBcIRRF>
      <vrIRRF>12000.00</vrIRRF>
      <infoIRCR>
        <codCR>056101</codCR>
        <vrCR>12000.00</vrCR>
      </infoIRCR>
    </infoIR>
  </evtIRRFConsolidado>
</eSocial>`;

  it('should have correct eventType', () => {
    expect(parser.eventType).toBe('S-5012');
  });

  it('should extract perApur', () => {
    const output = parser.parse(sampleXml);
    expect(output.perApur).toBe('2026-03');
  });

  it('should extract multiple infoIR entries', () => {
    const output = parser.parse(sampleXml);

    expect(output.infoIR).toHaveLength(2);
    expect(output.infoIR[0].nrInscEstab).toBe('12345678000195');
    expect(output.infoIR[0].vrBcIRRF).toBe(150000.0);
    expect(output.infoIR[0].vrIRRF).toBe(22500.0);
    expect(output.infoIR[1].nrInscEstab).toBe('98765432000100');
    expect(output.infoIR[1].vrBcIRRF).toBe(80000.0);
  });

  it('should extract infoIRCR per infoIR entry', () => {
    const output = parser.parse(sampleXml);

    expect(output.infoIR[0].infoIRCR).toHaveLength(2);
    expect(output.infoIR[0].infoIRCR[0].codCR).toBe('056101');
    expect(output.infoIR[0].infoIRCR[0].vrCR).toBe(18000.0);
    expect(output.infoIR[0].infoIRCR[1].codCR).toBe('056102');
    expect(output.infoIR[0].infoIRCR[1].vrCR).toBe(4500.0);

    expect(output.infoIR[1].infoIRCR).toHaveLength(1);
    expect(output.infoIR[1].infoIRCR[0].vrCR).toBe(12000.0);
  });

  it('should handle empty XML with defaults', () => {
    const minimalXml = `<perApur>2026-01</perApur>`;
    const output = parser.parse(minimalXml);

    expect(output.perApur).toBe('2026-01');
    expect(output.infoIR).toEqual([]);
  });

  it('should handle infoIR without infoIRCR children', () => {
    const noChildrenXml = `
      <perApur>2026-02</perApur>
      <infoIR>
        <nrInscEstab>11111111000111</nrInscEstab>
        <vrBcIRRF>50000.00</vrBcIRRF>
        <vrIRRF>7500.00</vrIRRF>
      </infoIR>`;

    const output = parser.parse(noChildrenXml);

    expect(output.infoIR).toHaveLength(1);
    expect(output.infoIR[0].vrBcIRRF).toBe(50000.0);
    expect(output.infoIR[0].infoIRCR).toEqual([]);
  });
});
