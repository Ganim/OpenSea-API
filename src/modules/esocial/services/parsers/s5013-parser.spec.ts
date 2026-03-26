import { describe, it, expect } from 'vitest';
import { S5013Parser } from './s5013-parser';

describe('S5013Parser', () => {
  const parser = new S5013Parser();

  const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtFGTSConsolidado/vS_01_02_00">
  <evtFGTSConsolidado>
    <ideEvento>
      <perApur>2026-03</perApur>
    </ideEvento>
    <infoDpsFGTS>
      <perApur>2026-03</perApur>
      <infoTotEstab>
        <tpInsc>1</tpInsc>
        <cnpjEstab>12345678000195</cnpjEstab>
        <vrFGTSEstab>25000.00</vrFGTSEstab>
        <infoTrabFGTS>
          <matricula>MAT-001</matricula>
          <cpfTrab>12345678909</cpfTrab>
          <vrFGTS>400.00</vrFGTS>
          <vrFGTS13>0.00</vrFGTS13>
        </infoTrabFGTS>
        <infoTrabFGTS>
          <cpfTrab>98765432100</cpfTrab>
          <vrFGTS>600.00</vrFGTS>
          <vrFGTS13>300.00</vrFGTS13>
        </infoTrabFGTS>
      </infoTotEstab>
      <infoTotEstab>
        <tpInsc>1</tpInsc>
        <cnpjEstab>98765432000100</cnpjEstab>
        <vrFGTSEstab>15000.00</vrFGTSEstab>
        <infoTrabFGTS>
          <cpfTrab>11122233344</cpfTrab>
          <vrFGTS>350.00</vrFGTS>
          <vrFGTS13>175.00</vrFGTS13>
        </infoTrabFGTS>
      </infoTotEstab>
    </infoDpsFGTS>
  </evtFGTSConsolidado>
</eSocial>`;

  it('should have correct eventType', () => {
    expect(parser.eventType).toBe('S-5013');
  });

  it('should extract perApur', () => {
    const output = parser.parse(sampleXml);
    expect(output.perApur).toBe('2026-03');
  });

  it('should extract infoDpsFGTS', () => {
    const output = parser.parse(sampleXml);

    expect(output.infoDpsFGTS).not.toBeNull();
    expect(output.infoDpsFGTS!.perApur).toBe('2026-03');
  });

  it('should extract multiple infoTotEstab entries', () => {
    const output = parser.parse(sampleXml);
    const estabs = output.infoDpsFGTS!.infoTotEstab;

    expect(estabs).toHaveLength(2);
    expect(estabs[0].cnpjEstab).toBe('12345678000195');
    expect(estabs[0].vrFGTSEstab).toBe(25000.0);
    expect(estabs[1].cnpjEstab).toBe('98765432000100');
    expect(estabs[1].vrFGTSEstab).toBe(15000.0);
  });

  it('should extract infoTrabFGTS per establishment', () => {
    const output = parser.parse(sampleXml);
    const firstEstab = output.infoDpsFGTS!.infoTotEstab[0];

    expect(firstEstab.infoTrabFGTS).toHaveLength(2);
    expect(firstEstab.infoTrabFGTS[0].matricula).toBe('MAT-001');
    expect(firstEstab.infoTrabFGTS[0].cpfTrab).toBe('12345678909');
    expect(firstEstab.infoTrabFGTS[0].vrFGTS).toBe(400.0);
    expect(firstEstab.infoTrabFGTS[0].vrFGTS13).toBe(0);
    expect(firstEstab.infoTrabFGTS[1].matricula).toBeNull();
    expect(firstEstab.infoTrabFGTS[1].cpfTrab).toBe('98765432100');
    expect(firstEstab.infoTrabFGTS[1].vrFGTS).toBe(600.0);
    expect(firstEstab.infoTrabFGTS[1].vrFGTS13).toBe(300.0);
  });

  it('should return null infoDpsFGTS when missing', () => {
    const minimalXml = `<perApur>2026-01</perApur>`;
    const output = parser.parse(minimalXml);

    expect(output.perApur).toBe('2026-01');
    expect(output.infoDpsFGTS).toBeNull();
  });

  it('should handle establishment with no workers', () => {
    const noWorkersXml = `
      <perApur>2026-02</perApur>
      <infoDpsFGTS>
        <perApur>2026-02</perApur>
        <infoTotEstab>
          <tpInsc>1</tpInsc>
          <cnpjEstab>11111111000111</cnpjEstab>
          <vrFGTSEstab>0.00</vrFGTSEstab>
        </infoTotEstab>
      </infoDpsFGTS>`;

    const output = parser.parse(noWorkersXml);
    const estab = output.infoDpsFGTS!.infoTotEstab[0];

    expect(estab.cnpjEstab).toBe('11111111000111');
    expect(estab.vrFGTSEstab).toBe(0);
    expect(estab.infoTrabFGTS).toEqual([]);
  });
});
