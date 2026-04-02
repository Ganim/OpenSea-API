import { describe, it, expect } from 'vitest';
import { S1299Builder } from './s1299-builder';
import type { S1299Input } from './s1299-builder';

describe('S1299Builder', () => {
  const builder = new S1299Builder();

  const baseInput: S1299Input = {
    tpInsc: 1,
    nrInsc: '12345678000195',
    perApur: '2026-03',
    nmResp: 'Carlos Administrador',
    cpfResp: '98765432100',
    telefone: '11999998888',
    email: 'carlos@empresa.com.br',
    evtRemun: 'S',
    evtPgtos: 'S',
    evtAqProd: 'N',
    evtComProd: 'N',
    evtContratAvNP: 'N',
    evtInfoComplPer: 'N',
  };

  it('should generate valid S-1299 XML with correct namespace', () => {
    const xml = builder.build(baseInput);

    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(xml).toContain(
      'xmlns="http://www.esocial.gov.br/schema/evt/evtFechaEvPer/vS_01_02_00"',
    );
    expect(xml).toMatch(/<evtFechaEvPer Id="ID1/);
  });

  // ---- ideEvento ----
  it('should include ideEvento with perApur (no indApuracao for S-1299)', () => {
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
    expect(xml).toContain('<nrInsc>12345678000195</nrInsc>');
  });

  // ---- ideRespInf ----
  it('should include ideRespInf with responsible person data', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<ideRespInf>');
    expect(xml).toContain('<nmResp>Carlos Administrador</nmResp>');
    expect(xml).toContain('<cpfResp>98765432100</cpfResp>');
    expect(xml).toContain('<telefone>11999998888</telefone>');
    expect(xml).toContain('<email>carlos@empresa.com.br</email>');
  });

  // ---- infoFech ----
  it('should include infoFech with all event flags', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<infoFech>');
    expect(xml).toContain('<evtRemun>S</evtRemun>');
    expect(xml).toContain('<evtPgtos>S</evtPgtos>');
    expect(xml).toContain('<evtAqProd>N</evtAqProd>');
    expect(xml).toContain('<evtComProd>N</evtComProd>');
    expect(xml).toContain('<evtContratAvNP>N</evtContratAvNP>');
    expect(xml).toContain('<evtInfoComplPer>N</evtInfoComplPer>');
  });

  it('should omit compSemMovto when not provided', () => {
    const xml = builder.build(baseInput);
    expect(xml).not.toContain('<compSemMovto>');
  });

  it('should include compSemMovto when provided', () => {
    const semMovtoInput: S1299Input = {
      ...baseInput,
      evtRemun: 'N',
      evtPgtos: 'N',
      compSemMovto: '2026-01',
    };
    const xml = builder.build(semMovtoInput);

    expect(xml).toContain('<compSemMovto>2026-01</compSemMovto>');
  });

  it('should handle period without any events (all N)', () => {
    const emptyPeriodInput: S1299Input = {
      ...baseInput,
      evtRemun: 'N',
      evtPgtos: 'N',
      evtAqProd: 'N',
      evtComProd: 'N',
      evtContratAvNP: 'N',
      evtInfoComplPer: 'N',
      compSemMovto: '2026-01',
    };
    const xml = builder.build(emptyPeriodInput);

    expect(xml).toContain('<evtRemun>N</evtRemun>');
    expect(xml).toContain('<evtPgtos>N</evtPgtos>');
    expect(xml).toContain('<compSemMovto>2026-01</compSemMovto>');
  });

  it('should support retificacao with nrRecibo', () => {
    const retificacaoInput: S1299Input = {
      ...baseInput,
      indRetif: 2,
      nrRecibo: 'REC-1299-001',
    };
    const xml = builder.build(retificacaoInput);

    expect(xml).toContain('<indRetif>2</indRetif>');
    expect(xml).toContain('<nrRecibo>REC-1299-001</nrRecibo>');
  });

  it('should not include nrRecibo when indRetif is 1', () => {
    const xml = builder.build(baseInput);
    expect(xml).not.toContain('<nrRecibo>');
  });

  it('should format cpfResp correctly', () => {
    const shortCpfInput: S1299Input = {
      ...baseInput,
      cpfResp: '1234567',
    };
    const xml = builder.build(shortCpfInput);

    expect(xml).toContain('<cpfResp>00001234567</cpfResp>');
  });

  it('should escape special characters in responsible person name', () => {
    const specialNameInput: S1299Input = {
      ...baseInput,
      nmResp: "José D'Angelo & Cia",
    };
    const xml = builder.build(specialNameInput);

    expect(xml).toContain('<nmResp>José D&apos;Angelo &amp; Cia</nmResp>');
  });

  it('should use production environment when tpAmb is 1', () => {
    const prodInput: S1299Input = {
      ...baseInput,
      tpAmb: 1,
    };
    const xml = builder.build(prodInput);

    expect(xml).toContain('<tpAmb>1</tpAmb>');
  });
});
