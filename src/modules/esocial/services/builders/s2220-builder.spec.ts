import { describe, it, expect } from 'vitest';
import { S2220Builder } from './s2220-builder';
import type { S2220Input } from './s2220-builder';

describe('S2220Builder', () => {
  const builder = new S2220Builder();

  const baseInput: S2220Input = {
    tpInsc: 1,
    nrInsc: '12345678000195',
    cpfTrab: '12345678909',
    matricula: 'EMP001',
    tpAso: 0,
    dtAso: new Date('2026-05-10T12:00:00Z'),
    resAso: 1,
    exames: [
      {
        dtExam: new Date('2026-05-09T12:00:00Z'),
        procRealizado: '0211070270',
        ordExame: 1,
        indResult: 1,
      },
    ],
    medico: {
      nmMedico: 'Dr. Ana Paula',
      nrCRM: '654321',
      ufCRM: 'RJ',
    },
  };

  it('should generate valid S-2220 XML with correct namespace', () => {
    const xml = builder.build(baseInput);

    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(xml).toContain(
      'xmlns="http://www.esocial.gov.br/schema/evt/evtMonit/vS_01_02_00"',
    );
    expect(xml).toMatch(/<evtMonit Id="ID1/);
  });

  it('should include ideVinculo', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<ideVinculo>');
    expect(xml).toContain('<cpfTrab>12345678909</cpfTrab>');
    expect(xml).toContain('<matricula>EMP001</matricula>');
  });

  it('should include exMedOcup with ASO data', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<exMedOcup>');
    expect(xml).toContain('<tpAso>0</tpAso>');
    expect(xml).toContain('<dtAso>2026-05-10</dtAso>');
    expect(xml).toContain('<resAso>1</resAso>');
  });

  it('should include exames', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<exame>');
    expect(xml).toContain('<dtExam>2026-05-09</dtExam>');
    expect(xml).toContain('<procRealizado>0211070270</procRealizado>');
    expect(xml).toContain('<ordExame>1</ordExame>');
    expect(xml).toContain('<indResult>1</indResult>');
  });

  it('should include medico', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<medico>');
    expect(xml).toContain('<nmMedico>Dr. Ana Paula</nmMedico>');
    expect(xml).toContain('<nrCRM>654321</nrCRM>');
    expect(xml).toContain('<ufCRM>RJ</ufCRM>');
  });

  it('should handle multiple exames', () => {
    const input: S2220Input = {
      ...baseInput,
      exames: [
        {
          dtExam: new Date('2026-05-08T12:00:00Z'),
          procRealizado: '0211070270',
          ordExame: 1,
          indResult: 1,
        },
        {
          dtExam: new Date('2026-05-09T12:00:00Z'),
          procRealizado: '0202031071',
          obsProc: 'Audiometria tonal',
          ordExame: 2,
          indResult: 1,
        },
      ],
    };
    const xml = builder.build(input);

    expect(xml).toContain('<procRealizado>0211070270</procRealizado>');
    expect(xml).toContain('<procRealizado>0202031071</procRealizado>');
    expect(xml).toContain('<obsProc>Audiometria tonal</obsProc>');
  });

  it('should omit optional exam fields when not provided', () => {
    const input: S2220Input = {
      ...baseInput,
      exames: [
        {
          dtExam: new Date('2026-05-09T12:00:00Z'),
          procRealizado: '0211070270',
          ordExame: 1,
        },
      ],
    };
    const xml = builder.build(input);

    expect(xml).not.toContain('<indResult>');
    expect(xml).not.toContain('<obsProc>');
  });

  it('should support demissional ASO type', () => {
    const input: S2220Input = {
      ...baseInput,
      tpAso: 4,
      resAso: 1,
    };
    const xml = builder.build(input);

    expect(xml).toContain('<tpAso>4</tpAso>');
  });

  it('should support retificacao', () => {
    const input: S2220Input = {
      ...baseInput,
      indRetif: 2,
      nrRecibo: 'REC-2220-001',
    };
    const xml = builder.build(input);

    expect(xml).toContain('<indRetif>2</indRetif>');
    expect(xml).toContain('<nrRecibo>REC-2220-001</nrRecibo>');
  });
});
