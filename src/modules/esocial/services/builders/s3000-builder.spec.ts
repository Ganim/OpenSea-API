import { describe, it, expect } from 'vitest';
import { S3000Builder } from './s3000-builder';
import type { S3000Input } from './s3000-builder';

describe('S3000Builder', () => {
  const builder = new S3000Builder();

  const baseInput: S3000Input = {
    tpInsc: 1,
    nrInsc: '12345678000195',
    tpEvento: 'S-2200',
    nrRecEvt: '1.2.0000000000000000001',
    cpfTrab: '12345678909',
  };

  it('should generate valid S-3000 XML with correct namespace', () => {
    const xml = builder.build(baseInput);

    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(xml).toContain(
      'xmlns="http://www.esocial.gov.br/schema/evt/evtExclusao/vS_01_02_00"',
    );
    expect(xml).toMatch(/<evtExclusao Id="ID1/);
  });

  it('should include infoExclusao with tpEvento and nrRecEvt', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<infoExclusao>');
    expect(xml).toContain('<tpEvento>S-2200</tpEvento>');
    expect(xml).toContain('<nrRecEvt>1.2.0000000000000000001</nrRecEvt>');
  });

  it('should include ideTrabalhador when cpfTrab is provided', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<ideTrabalhador>');
    expect(xml).toContain('<cpfTrab>12345678909</cpfTrab>');
  });

  it('should omit ideTrabalhador when cpfTrab is not provided', () => {
    const input: S3000Input = {
      tpInsc: 1,
      nrInsc: '12345678000195',
      tpEvento: 'S-1000',
      nrRecEvt: '1.2.0000000000000000002',
    };
    const xml = builder.build(input);

    expect(xml).not.toContain('<ideTrabalhador>');
    expect(xml).not.toContain('<cpfTrab>');
  });

  it('should include perApur for periodic events', () => {
    const input: S3000Input = {
      tpInsc: 1,
      nrInsc: '12345678000195',
      tpEvento: 'S-1200',
      nrRecEvt: '1.2.0000000000000000003',
      cpfTrab: '12345678909',
      perApur: '2026-05',
    };
    const xml = builder.build(input);

    expect(xml).toContain('<perApur>2026-05</perApur>');
  });

  it('should omit perApur when not provided', () => {
    const xml = builder.build(baseInput);

    expect(xml).not.toContain('<perApur>');
  });

  it('should handle exclusion of various event types', () => {
    const eventTypes = [
      'S-2190',
      'S-2200',
      'S-2205',
      'S-2206',
      'S-2210',
      'S-2220',
      'S-2230',
      'S-2240',
      'S-2298',
      'S-2299',
      'S-2300',
      'S-2399',
    ];

    for (const tpEvento of eventTypes) {
      const input: S3000Input = {
        ...baseInput,
        tpEvento,
        nrRecEvt: `REC-${tpEvento}-001`,
      };
      const xml = builder.build(input);
      expect(xml).toContain(`<tpEvento>${tpEvento}</tpEvento>`);
    }
  });

  it('should support retificacao', () => {
    const input: S3000Input = {
      ...baseInput,
      indRetif: 2,
      nrRecibo: 'REC-3000-001',
    };
    const xml = builder.build(input);

    expect(xml).toContain('<indRetif>2</indRetif>');
    expect(xml).toContain('<nrRecibo>REC-3000-001</nrRecibo>');
  });
});
