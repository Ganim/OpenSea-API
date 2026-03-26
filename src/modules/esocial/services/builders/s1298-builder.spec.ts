import { describe, it, expect } from 'vitest';
import { S1298Builder } from './s1298-builder';
import type { S1298Input } from './s1298-builder';

describe('S1298Builder', () => {
  const builder = new S1298Builder();

  const baseInput: S1298Input = {
    tpInsc: 1,
    nrInsc: '12345678000195',
    perApur: '2026-03',
  };

  it('should generate valid S-1298 XML with correct namespace', () => {
    const xml = builder.build(baseInput);

    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(xml).toContain(
      'xmlns="http://www.esocial.gov.br/schema/evt/evtReabreEvPer/vS_01_02_00"',
    );
    expect(xml).toMatch(/<evtReabreEvPer Id="ID1/);
  });

  // ---- ideEvento ----
  it('should include ideEvento with perApur', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<ideEvento>');
    expect(xml).toContain('<indRetif>1</indRetif>');
    expect(xml).toContain('<perApur>2026-03</perApur>');
    expect(xml).toContain('<tpAmb>2</tpAmb>');
    expect(xml).toContain('<verProc>OpenSea-1.0</verProc>');
  });

  // ---- ideEmpregador ----
  it('should include ideEmpregador with CNPJ', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<ideEmpregador>');
    expect(xml).toContain('<tpInsc>1</tpInsc>');
    expect(xml).toContain('<nrInsc>12345678000195</nrInsc>');
  });

  it('should be a minimal event with only ideEvento and ideEmpregador', () => {
    const xml = builder.build(baseInput);

    // Should NOT contain any of the sections from other periodic events
    expect(xml).not.toContain('<ideTrabalhador>');
    expect(xml).not.toContain('<dmDev>');
    expect(xml).not.toContain('<infoFech>');
    expect(xml).not.toContain('<ideRespInf>');
    expect(xml).not.toContain('<ideBenef>');
  });

  it('should support retificacao with nrRecibo', () => {
    const retificacaoInput: S1298Input = {
      ...baseInput,
      indRetif: 2,
      nrRecibo: 'REC-1298-001',
    };
    const xml = builder.build(retificacaoInput);

    expect(xml).toContain('<indRetif>2</indRetif>');
    expect(xml).toContain('<nrRecibo>REC-1298-001</nrRecibo>');
  });

  it('should not include nrRecibo when indRetif is 1', () => {
    const xml = builder.build(baseInput);
    expect(xml).not.toContain('<nrRecibo>');
  });

  it('should default to homologacao environment (tpAmb=2)', () => {
    const xml = builder.build(baseInput);
    expect(xml).toContain('<tpAmb>2</tpAmb>');
  });

  it('should support production environment (tpAmb=1)', () => {
    const prodInput: S1298Input = {
      ...baseInput,
      tpAmb: 1,
    };
    const xml = builder.build(prodInput);

    expect(xml).toContain('<tpAmb>1</tpAmb>');
  });

  it('should handle CPF-based employer (tpInsc=2)', () => {
    const cpfEmployerInput: S1298Input = {
      tpInsc: 2,
      nrInsc: '12345678909',
      perApur: '2026-03',
    };
    const xml = builder.build(cpfEmployerInput);

    expect(xml).toContain('<tpInsc>2</tpInsc>');
    expect(xml).toContain('<nrInsc>12345678909</nrInsc>');
  });

  it('should generate unique event ID with employer inscription', () => {
    const xml = builder.build(baseInput);

    // Event ID starts with ID + tpInsc + nrInsc padded to 14 digits
    expect(xml).toMatch(/<evtReabreEvPer Id="ID112345678000195\d{19}">/);
  });

  it('should handle different perApur values', () => {
    const decemberInput: S1298Input = {
      ...baseInput,
      perApur: '2025-12',
    };
    const xml = builder.build(decemberInput);

    expect(xml).toContain('<perApur>2025-12</perApur>');
  });
});
