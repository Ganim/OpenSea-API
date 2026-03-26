import { describe, it, expect } from 'vitest';
import { S1200Builder } from './s1200-builder';
import type { S1200Input } from './s1200-builder';

describe('S1200Builder', () => {
  const builder = new S1200Builder();

  const baseInput: S1200Input = {
    tpInsc: 1,
    nrInsc: '12345678000195',
    perApur: '2026-03',
    cpfTrab: '12345678909',
    dmDev: [
      {
        ideDmDev: 'DEM-001',
        codCateg: 101,
        infoPerApur: {
          ideEstabLot: [
            {
              tpInsc: 1,
              nrInsc: '12345678000195',
              codLotacao: 'LOT001',
              remunPerApur: [
                {
                  itensRemun: [
                    {
                      codRubr: 'RUB-SAL',
                      ideTabRubr: 'TAB001',
                      vrRubr: 5000.0,
                    },
                    {
                      codRubr: 'RUB-HE50',
                      ideTabRubr: 'TAB001',
                      qtdRubr: 10,
                      fatorRubr: 1.5,
                      vrRubr: 340.91,
                    },
                    {
                      codRubr: 'RUB-INSS',
                      ideTabRubr: 'TAB001',
                      vrRubr: 550.0,
                      indApurIR: 0,
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    ],
  };

  it('should generate valid S-1200 XML with correct namespace', () => {
    const xml = builder.build(baseInput);

    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(xml).toContain(
      'xmlns="http://www.esocial.gov.br/schema/evt/evtRemun/vS_01_02_00"',
    );
    expect(xml).toMatch(/<evtRemun Id="ID1/);
  });

  // ---- ideEvento ----
  it('should include ideEvento with perApur and indApuracao', () => {
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
    expect(xml).toContain('<tpInsc>1</tpInsc>');
    expect(xml).toContain('<nrInsc>12345678000195</nrInsc>');
  });

  // ---- ideTrabalhador ----
  it('should include ideTrabalhador with CPF', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<ideTrabalhador>');
    expect(xml).toContain('<cpfTrab>12345678909</cpfTrab>');
  });

  // ---- dmDev ----
  it('should include dmDev with ideDmDev and codCateg', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<dmDev>');
    expect(xml).toContain('<ideDmDev>DEM-001</ideDmDev>');
    expect(xml).toContain('<codCateg>101</codCateg>');
  });

  it('should include infoPerApur > ideEstabLot', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<infoPerApur>');
    expect(xml).toContain('<ideEstabLot>');
    expect(xml).toContain('<codLotacao>LOT001</codLotacao>');
  });

  it('should include remunPerApur with itensRemun', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<remunPerApur>');
    expect(xml).toContain('<itensRemun>');
    expect(xml).toContain('<codRubr>RUB-SAL</codRubr>');
    expect(xml).toContain('<ideTabRubr>TAB001</ideTabRubr>');
    expect(xml).toContain('<vrRubr>5000.00</vrRubr>');
  });

  it('should include optional rubrica fields (qtdRubr, fatorRubr)', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<qtdRubr>10</qtdRubr>');
    expect(xml).toContain('<fatorRubr>1.5</fatorRubr>');
    expect(xml).toContain('<vrRubr>340.91</vrRubr>');
  });

  it('should include indApurIR when provided', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<indApurIR>0</indApurIR>');
  });

  it('should omit qtdRubr and fatorRubr when not provided', () => {
    const xml = builder.build(baseInput);

    // The salary rubrica (first one) has no qtdRubr or fatorRubr
    // Check that the salary item does NOT have these fields
    const salaryMatch = xml.match(
      /<itensRemun><codRubr>RUB-SAL<\/codRubr>.*?<\/itensRemun>/s,
    );
    expect(salaryMatch).not.toBeNull();
    expect(salaryMatch![0]).not.toContain('<qtdRubr>');
    expect(salaryMatch![0]).not.toContain('<fatorRubr>');
  });

  it('should handle multiple dmDev entries', () => {
    const multiDmDevInput: S1200Input = {
      ...baseInput,
      dmDev: [
        {
          ideDmDev: 'DEM-MENSAL',
          codCateg: 101,
          infoPerApur: {
            ideEstabLot: [
              {
                tpInsc: 1,
                nrInsc: '12345678000195',
                codLotacao: 'LOT001',
                remunPerApur: [
                  {
                    itensRemun: [
                      { codRubr: 'RUB-SAL', ideTabRubr: 'TAB001', vrRubr: 5000 },
                    ],
                  },
                ],
              },
            ],
          },
        },
        {
          ideDmDev: 'DEM-13SAL',
          codCateg: 101,
          infoPerApur: {
            ideEstabLot: [
              {
                tpInsc: 1,
                nrInsc: '12345678000195',
                codLotacao: 'LOT001',
                remunPerApur: [
                  {
                    itensRemun: [
                      { codRubr: 'RUB-13S', ideTabRubr: 'TAB001', vrRubr: 2500 },
                    ],
                  },
                ],
              },
            ],
          },
        },
      ],
    };

    const xml = builder.build(multiDmDevInput);

    expect(xml).toContain('<ideDmDev>DEM-MENSAL</ideDmDev>');
    expect(xml).toContain('<ideDmDev>DEM-13SAL</ideDmDev>');
    expect(xml).toContain('<codRubr>RUB-SAL</codRubr>');
    expect(xml).toContain('<codRubr>RUB-13S</codRubr>');
  });

  it('should handle multiple ideEstabLot (branch offices)', () => {
    const multiBranchInput: S1200Input = {
      ...baseInput,
      dmDev: [
        {
          ideDmDev: 'DEM-001',
          codCateg: 101,
          infoPerApur: {
            ideEstabLot: [
              {
                tpInsc: 1,
                nrInsc: '12345678000195',
                codLotacao: 'LOT-MATRIZ',
                remunPerApur: [
                  {
                    itensRemun: [
                      { codRubr: 'RUB-SAL', ideTabRubr: 'TAB001', vrRubr: 3000 },
                    ],
                  },
                ],
              },
              {
                tpInsc: 1,
                nrInsc: '12345678000276',
                codLotacao: 'LOT-FILIAL',
                remunPerApur: [
                  {
                    itensRemun: [
                      { codRubr: 'RUB-SAL', ideTabRubr: 'TAB001', vrRubr: 2000 },
                    ],
                  },
                ],
              },
            ],
          },
        },
      ],
    };

    const xml = builder.build(multiBranchInput);

    expect(xml).toContain('<codLotacao>LOT-MATRIZ</codLotacao>');
    expect(xml).toContain('<codLotacao>LOT-FILIAL</codLotacao>');
    expect(xml).toContain('<nrInsc>12345678000276</nrInsc>');
  });

  it('should support retificacao with nrRecibo', () => {
    const retificacaoInput: S1200Input = {
      ...baseInput,
      indRetif: 2,
      nrRecibo: 'REC-1200-001',
    };
    const xml = builder.build(retificacaoInput);

    expect(xml).toContain('<indRetif>2</indRetif>');
    expect(xml).toContain('<nrRecibo>REC-1200-001</nrRecibo>');
  });

  it('should not include nrRecibo when indRetif is 1', () => {
    const xml = builder.build(baseInput);

    expect(xml).not.toContain('<nrRecibo>');
  });

  it('should format monetary values with 2 decimal places', () => {
    const roundingInput: S1200Input = {
      ...baseInput,
      dmDev: [
        {
          ideDmDev: 'DEM-001',
          codCateg: 101,
          infoPerApur: {
            ideEstabLot: [
              {
                tpInsc: 1,
                nrInsc: '12345678000195',
                codLotacao: 'LOT001',
                remunPerApur: [
                  {
                    itensRemun: [
                      { codRubr: 'RUB-SAL', ideTabRubr: 'TAB001', vrRubr: 1234 },
                    ],
                  },
                ],
              },
            ],
          },
        },
      ],
    };
    const xml = builder.build(roundingInput);

    expect(xml).toContain('<vrRubr>1234.00</vrRubr>');
  });

  it('should format CPF with leading zeros', () => {
    const shortCpfInput: S1200Input = {
      ...baseInput,
      cpfTrab: '1234567',
    };
    const xml = builder.build(shortCpfInput);

    expect(xml).toContain('<cpfTrab>00001234567</cpfTrab>');
  });

  it('should escape special XML characters in rubrica codes', () => {
    const specialInput: S1200Input = {
      ...baseInput,
      dmDev: [
        {
          ideDmDev: 'DEM-001',
          codCateg: 101,
          infoPerApur: {
            ideEstabLot: [
              {
                tpInsc: 1,
                nrInsc: '12345678000195',
                codLotacao: 'LOT001',
                remunPerApur: [
                  {
                    itensRemun: [
                      {
                        codRubr: 'RUB&SAL',
                        ideTabRubr: 'TAB<01>',
                        vrRubr: 1000,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      ],
    };
    const xml = builder.build(specialInput);

    expect(xml).toContain('<codRubr>RUB&amp;SAL</codRubr>');
    expect(xml).toContain('<ideTabRubr>TAB&lt;01&gt;</ideTabRubr>');
  });
});
