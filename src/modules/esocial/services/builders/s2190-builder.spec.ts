import { describe, it, expect } from 'vitest';
import { S2190Builder } from './s2190-builder';
import type { S2190Input } from './s2190-builder';

describe('S2190Builder', () => {
  const builder = new S2190Builder();

  const baseInput: S2190Input = {
    tpInsc: 1,
    nrInsc: '12345678000195',
    cpfTrab: '123.456.789-09',
    dtNascto: new Date('1990-06-15T12:00:00Z'),
    dtAdm: new Date('2026-04-01T12:00:00Z'),
  };

  it('should generate valid S-2190 XML', () => {
    const xml = builder.build(baseInput);

    // Must start with XML declaration
    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);

    // Root element with correct namespace
    expect(xml).toContain(
      'xmlns="http://www.esocial.gov.br/schema/evt/evtAdmPrelim/vS_01_02_00"',
    );

    // Event wrapper with Id attribute
    expect(xml).toMatch(/<evtAdmPrelim Id="ID1/);
  });

  it('should include ideEvento with defaults (original, homologacao)', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<indRetif>1</indRetif>');
    expect(xml).toContain('<tpAmb>2</tpAmb>');
    expect(xml).toContain('<procEmi>1</procEmi>');
    expect(xml).toContain('<verProc>OpenSea-1.0</verProc>');
  });

  it('should include ideEmpregador with formatted CNPJ', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<tpInsc>1</tpInsc>');
    expect(xml).toContain('<nrInsc>12345678000195</nrInsc>');
  });

  it('should include infoRegPrelim with formatted worker data', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<cpfTrab>12345678909</cpfTrab>');
    expect(xml).toContain('<dtNascto>1990-06-15</dtNascto>');
    expect(xml).toContain('<dtAdm>2026-04-01</dtAdm>');
  });

  it('should support retificacao mode with receipt number', () => {
    const input: S2190Input = {
      ...baseInput,
      indRetif: 2,
      nrRecibo: 'REC-2026-001',
    };
    const xml = builder.build(input);

    expect(xml).toContain('<indRetif>2</indRetif>');
    expect(xml).toContain('<nrRecibo>REC-2026-001</nrRecibo>');
  });

  it('should support producao environment', () => {
    const input: S2190Input = {
      ...baseInput,
      tpAmb: 1,
    };
    const xml = builder.build(input);

    expect(xml).toContain('<tpAmb>1</tpAmb>');
  });

  it('should format CPF with dots/dashes correctly', () => {
    const input: S2190Input = {
      ...baseInput,
      cpfTrab: '000.111.222-33',
    };
    const xml = builder.build(input);

    expect(xml).toContain('<cpfTrab>00011122233</cpfTrab>');
  });

  it('should accept ISO string dates', () => {
    const input: S2190Input = {
      ...baseInput,
      dtNascto: '1985-12-31T12:00:00.000Z',
      dtAdm: '2026-06-01T12:00:00.000Z',
    };
    const xml = builder.build(input);

    expect(xml).toContain('<dtNascto>1985-12-31</dtNascto>');
    expect(xml).toContain('<dtAdm>2026-06-01</dtAdm>');
  });
});
