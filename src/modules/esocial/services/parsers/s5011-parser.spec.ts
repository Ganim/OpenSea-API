import { describe, it, expect } from 'vitest';
import { S5011Parser } from './s5011-parser';

describe('S5011Parser', () => {
  const parser = new S5011Parser();

  const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtCSConsolidado/vS_01_02_00">
  <evtCSConsolidado>
    <ideEvento>
      <perApur>2026-03</perApur>
    </ideEvento>
    <infoCS>
      <nrRecArqBase>REC-2026-03-001</nrRecArqBase>
      <infoComplObra>
        <nrInscProp>12345678000195</nrInscProp>
        <vrCpObra>1500.00</vrCpObra>
      </infoComplObra>
      <ideEstab>
        <tpInsc>1</tpInsc>
        <nrInscEstab>12345678000195</nrInscEstab>
        <infoCRContrib>
          <tpCR>108201</tpCR>
          <vrCR>3200.50</vrCR>
        </infoCRContrib>
        <infoCRContrib>
          <tpCR>108202</tpCR>
          <vrCR>1600.25</vrCR>
        </infoCRContrib>
      </ideEstab>
      <ideEstab>
        <tpInsc>1</tpInsc>
        <nrInscEstab>98765432000100</nrInscEstab>
        <infoCRContrib>
          <tpCR>108201</tpCR>
          <vrCR>800.00</vrCR>
        </infoCRContrib>
      </ideEstab>
    </infoCS>
  </evtCSConsolidado>
</eSocial>`;

  it('should have correct eventType', () => {
    expect(parser.eventType).toBe('S-5011');
  });

  it('should extract perApur', () => {
    const output = parser.parse(sampleXml);
    expect(output.perApur).toBe('2026-03');
  });

  it('should extract nrRecArqBase', () => {
    const output = parser.parse(sampleXml);
    expect(output.infoCS.nrRecArqBase).toBe('REC-2026-03-001');
  });

  it('should extract infoComplObra', () => {
    const output = parser.parse(sampleXml);

    expect(output.infoCS.infoComplObra).toHaveLength(1);
    expect(output.infoCS.infoComplObra[0].nrInscProp).toBe('12345678000195');
    expect(output.infoCS.infoComplObra[0].vrCpObra).toBe(1500.0);
  });

  it('should extract multiple ideEstab entries', () => {
    const output = parser.parse(sampleXml);

    expect(output.infoCS.ideEstab).toHaveLength(2);
    expect(output.infoCS.ideEstab[0].nrInscEstab).toBe('12345678000195');
    expect(output.infoCS.ideEstab[1].nrInscEstab).toBe('98765432000100');
  });

  it('should extract infoCRContrib per establishment', () => {
    const output = parser.parse(sampleXml);

    const firstEstab = output.infoCS.ideEstab[0];
    expect(firstEstab.infoCRContrib).toHaveLength(2);
    expect(firstEstab.infoCRContrib[0].tpCR).toBe('108201');
    expect(firstEstab.infoCRContrib[0].vrCR).toBe(3200.5);
    expect(firstEstab.infoCRContrib[1].tpCR).toBe('108202');
    expect(firstEstab.infoCRContrib[1].vrCR).toBe(1600.25);

    const secondEstab = output.infoCS.ideEstab[1];
    expect(secondEstab.infoCRContrib).toHaveLength(1);
    expect(secondEstab.infoCRContrib[0].vrCR).toBe(800.0);
  });

  it('should handle missing nrRecArqBase and infoComplObra', () => {
    const minimalXml = `
      <perApur>2026-02</perApur>
      <infoCS>
        <ideEstab>
          <tpInsc>1</tpInsc>
          <nrInscEstab>11111111000111</nrInscEstab>
        </ideEstab>
      </infoCS>`;

    const output = parser.parse(minimalXml);

    expect(output.perApur).toBe('2026-02');
    expect(output.infoCS.nrRecArqBase).toBeNull();
    expect(output.infoCS.infoComplObra).toEqual([]);
    expect(output.infoCS.ideEstab).toHaveLength(1);
  });
});
