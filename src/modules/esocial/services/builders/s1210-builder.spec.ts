import { describe, it, expect } from 'vitest';
import { S1210Builder } from './s1210-builder';
import type { S1210Input } from './s1210-builder';

describe('S1210Builder', () => {
  const builder = new S1210Builder();

  const baseInput: S1210Input = {
    tpInsc: 1,
    nrInsc: '12345678000195',
    perApur: '2026-03',
    ideBenef: {
      cpfBenef: '12345678909',
      deps: {
        vrDedDep: 189.59,
      },
    },
    infoPgto: [
      {
        dtPgto: new Date('2026-04-05T12:00:00Z'),
        tpPgto: 1,
        indResBr: 'S',
        detPgtoFl: [
          {
            perRef: '2026-03',
            ideDmDev: 'DEM-001',
            vrLiq: 4200.5,
          },
        ],
      },
    ],
  };

  it('should generate valid S-1210 XML with correct namespace', () => {
    const xml = builder.build(baseInput);

    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(xml).toContain(
      'xmlns="http://www.esocial.gov.br/schema/evt/evtPgtos/vS_01_02_00"',
    );
    expect(xml).toMatch(/<evtPgtos Id="ID1/);
  });

  // ---- ideEvento ----
  it('should include ideEvento with perApur', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<ideEvento>');
    expect(xml).toContain('<indRetif>1</indRetif>');
    expect(xml).toContain('<indApuracao>1</indApuracao>');
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

  // ---- ideBenef ----
  it('should include ideBenef with CPF', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<ideBenef>');
    expect(xml).toContain('<cpfBenef>12345678909</cpfBenef>');
  });

  it('should include deps with vrDedDep when provided', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<deps>');
    expect(xml).toContain('<vrDedDep>189.59</vrDedDep>');
  });

  it('should omit deps when not provided', () => {
    const noDepsInput: S1210Input = {
      ...baseInput,
      ideBenef: {
        cpfBenef: '12345678909',
      },
    };
    const xml = builder.build(noDepsInput);

    expect(xml).not.toContain('<deps>');
    expect(xml).not.toContain('<vrDedDep>');
  });

  // ---- infoPgto ----
  it('should include infoPgto with dtPgto, tpPgto, indResBr', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<infoPgto>');
    expect(xml).toContain('<dtPgto>2026-04-05</dtPgto>');
    expect(xml).toContain('<tpPgto>1</tpPgto>');
    expect(xml).toContain('<indResBr>S</indResBr>');
  });

  it('should include detPgtoFl with perRef, ideDmDev, vrLiq', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<detPgtoFl>');
    expect(xml).toContain('<perRef>2026-03</perRef>');
    expect(xml).toContain('<ideDmDev>DEM-001</ideDmDev>');
    expect(xml).toContain('<vrLiq>4200.50</vrLiq>');
  });

  it('should include indPgtoTt in detPgtoFl when provided', () => {
    const rescisaoInput: S1210Input = {
      ...baseInput,
      infoPgto: [
        {
          dtPgto: new Date('2026-04-05T12:00:00Z'),
          tpPgto: 2,
          indResBr: 'S',
          detPgtoFl: [
            {
              perRef: '2026-03',
              ideDmDev: 'DEM-RESC',
              indPgtoTt: 'S',
              vrLiq: 15000.0,
            },
          ],
        },
      ],
    };
    const xml = builder.build(rescisaoInput);

    expect(xml).toContain('<indPgtoTt>S</indPgtoTt>');
    expect(xml).toContain('<tpPgto>2</tpPgto>');
  });

  it('should include detPgtoBenPr when provided', () => {
    const beneficioInput: S1210Input = {
      ...baseInput,
      infoPgto: [
        {
          dtPgto: new Date('2026-04-05T12:00:00Z'),
          tpPgto: 5,
          indResBr: 'S',
          detPgtoBenPr: [
            {
              perRef: '2026-03',
              ideDmDev: 'DEM-BEN-001',
              vrLiq: 3200.0,
            },
          ],
        },
      ],
    };
    const xml = builder.build(beneficioInput);

    expect(xml).toContain('<detPgtoBenPr>');
    expect(xml).toContain('<ideDmDev>DEM-BEN-001</ideDmDev>');
    expect(xml).toContain('<vrLiq>3200.00</vrLiq>');
    expect(xml).toContain('<tpPgto>5</tpPgto>');
  });

  it('should handle multiple infoPgto entries', () => {
    const multiPgtoInput: S1210Input = {
      ...baseInput,
      infoPgto: [
        {
          dtPgto: new Date('2026-04-05T12:00:00Z'),
          tpPgto: 1,
          indResBr: 'S',
          detPgtoFl: [
            { perRef: '2026-03', ideDmDev: 'DEM-MENSAL', vrLiq: 4200.5 },
          ],
        },
        {
          dtPgto: new Date('2026-04-20T12:00:00Z'),
          tpPgto: 1,
          indResBr: 'S',
          detPgtoFl: [
            { perRef: '2026-03', ideDmDev: 'DEM-ADT', vrLiq: 1500.0 },
          ],
        },
      ],
    };
    const xml = builder.build(multiPgtoInput);

    expect(xml).toContain('<dtPgto>2026-04-05</dtPgto>');
    expect(xml).toContain('<dtPgto>2026-04-20</dtPgto>');
    expect(xml).toContain('<ideDmDev>DEM-MENSAL</ideDmDev>');
    expect(xml).toContain('<ideDmDev>DEM-ADT</ideDmDev>');
  });

  it('should handle multiple detPgtoFl in same infoPgto', () => {
    const multiDetInput: S1210Input = {
      ...baseInput,
      infoPgto: [
        {
          dtPgto: new Date('2026-04-05T12:00:00Z'),
          tpPgto: 1,
          indResBr: 'S',
          detPgtoFl: [
            { perRef: '2026-03', ideDmDev: 'DEM-001', vrLiq: 4200.5 },
            { perRef: '2026-02', ideDmDev: 'DEM-DIF', vrLiq: 500.0 },
          ],
        },
      ],
    };
    const xml = builder.build(multiDetInput);

    expect(xml).toContain('<ideDmDev>DEM-001</ideDmDev>');
    expect(xml).toContain('<ideDmDev>DEM-DIF</ideDmDev>');
    expect(xml).toContain('<perRef>2026-02</perRef>');
  });

  it('should support retificacao with nrRecibo', () => {
    const retificacaoInput: S1210Input = {
      ...baseInput,
      indRetif: 2,
      nrRecibo: 'REC-1210-001',
    };
    const xml = builder.build(retificacaoInput);

    expect(xml).toContain('<indRetif>2</indRetif>');
    expect(xml).toContain('<nrRecibo>REC-1210-001</nrRecibo>');
  });

  it('should not include nrRecibo when indRetif is 1', () => {
    const xml = builder.build(baseInput);
    expect(xml).not.toContain('<nrRecibo>');
  });

  it('should format monetary values with 2 decimal places', () => {
    const xml = builder.build(baseInput);
    expect(xml).toContain('<vrLiq>4200.50</vrLiq>');
    expect(xml).toContain('<vrDedDep>189.59</vrDedDep>');
  });

  it('should format CPF with leading zeros', () => {
    const shortCpfInput: S1210Input = {
      ...baseInput,
      ideBenef: {
        cpfBenef: '1234567',
      },
    };
    const xml = builder.build(shortCpfInput);

    expect(xml).toContain('<cpfBenef>00001234567</cpfBenef>');
  });
});
