import { describe, it, expect } from 'vitest';
import {
  S2299Builder,
  TERMINATION_TYPE_TO_ESOCIAL_MOTIVO,
} from './s2299-builder';
import type { S2299Input } from './s2299-builder';
import { TerminationType } from '@/entities/hr/termination';

describe('S2299Builder', () => {
  const builder = new S2299Builder();

  const baseInput: S2299Input = {
    tpInsc: 1,
    nrInsc: '12345678000195',
    cpfTrab: '12345678909',
    matricula: 'EMP001',
    mtvDeslig: '02', // Sem justa causa
    dtDeslig: new Date('2026-06-30T12:00:00Z'),
  };

  it('should generate valid S-2299 XML with correct namespace', () => {
    const xml = builder.build(baseInput);

    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(xml).toContain(
      'xmlns="http://www.esocial.gov.br/schema/evt/evtDeslig/vS_01_02_00"',
    );
    expect(xml).toMatch(/<evtDeslig Id="ID1/);
  });

  it('should include ideVinculo', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<ideVinculo>');
    expect(xml).toContain('<cpfTrab>12345678909</cpfTrab>');
    expect(xml).toContain('<matricula>EMP001</matricula>');
  });

  it('should include infoDeslig with motivo and date', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<infoDeslig>');
    expect(xml).toContain('<mtvDeslig>02</mtvDeslig>');
    expect(xml).toContain('<dtDeslig>2026-06-30</dtDeslig>');
  });

  it('should omit verbasResc when rubricas not provided', () => {
    const xml = builder.build(baseInput);
    expect(xml).not.toContain('<verbasResc>');
  });

  it('should include verbasResc when rubricas are provided', () => {
    const input: S2299Input = {
      ...baseInput,
      rubricas: [
        {
          codRubr: '1000',
          tpRubr: 1,
          natRubr: '1000',
          vrRubr: 5000,
        },
        {
          codRubr: '5001',
          tpRubr: 2,
          natRubr: '9201',
          vrRubr: 550,
        },
      ],
    };
    const xml = builder.build(input);

    expect(xml).toContain('<verbasResc>');
    expect(xml).toContain('<dmDev>');
    expect(xml).toContain('<ideDmDev>1</ideDmDev>');
    expect(xml).toContain('<infoPerApur>');
    expect(xml).toContain('<ideEstabLot>');

    // First rubrica
    expect(xml).toContain('<codRubr>1000</codRubr>');
    expect(xml).toContain('<vrRubr>5000.00</vrRubr>');

    // Second rubrica
    expect(xml).toContain('<codRubr>5001</codRubr>');
    expect(xml).toContain('<vrRubr>550.00</vrRubr>');
  });

  it('should include optional fields when provided', () => {
    const input: S2299Input = {
      ...baseInput,
      indPagtoAPI: 2,
      dtProjFimAPI: new Date('2026-07-30T12:00:00Z'),
      pensAlim: 'N',
      percAliment: 40,
    };
    const xml = builder.build(input);

    expect(xml).toContain('<indPagtoAPI>2</indPagtoAPI>');
    expect(xml).toContain('<dtProjFimAPI>2026-07-30</dtProjFimAPI>');
    expect(xml).toContain('<pensAlim>N</pensAlim>');
    expect(xml).toContain('<percAliment>40.00</percAliment>');
  });

  it('should support retificacao', () => {
    const input: S2299Input = {
      ...baseInput,
      indRetif: 2,
      nrRecibo: 'REC-2299-001',
    };
    const xml = builder.build(input);
    expect(xml).toContain('<indRetif>2</indRetif>');
    expect(xml).toContain('<nrRecibo>REC-2299-001</nrRecibo>');
  });

  describe('TERMINATION_TYPE_TO_ESOCIAL_MOTIVO', () => {
    it('should map SEM_JUSTA_CAUSA to 02', () => {
      expect(
        TERMINATION_TYPE_TO_ESOCIAL_MOTIVO[TerminationType.SEM_JUSTA_CAUSA],
      ).toBe('02');
    });

    it('should map JUSTA_CAUSA to 01', () => {
      expect(
        TERMINATION_TYPE_TO_ESOCIAL_MOTIVO[TerminationType.JUSTA_CAUSA],
      ).toBe('01');
    });

    it('should map PEDIDO_DEMISSAO to 03', () => {
      expect(
        TERMINATION_TYPE_TO_ESOCIAL_MOTIVO[TerminationType.PEDIDO_DEMISSAO],
      ).toBe('03');
    });

    it('should map ACORDO_MUTUO to 33', () => {
      expect(
        TERMINATION_TYPE_TO_ESOCIAL_MOTIVO[TerminationType.ACORDO_MUTUO],
      ).toBe('33');
    });

    it('should map CONTRATO_TEMPORARIO to 04', () => {
      expect(
        TERMINATION_TYPE_TO_ESOCIAL_MOTIVO[TerminationType.CONTRATO_TEMPORARIO],
      ).toBe('04');
    });

    it('should map RESCISAO_INDIRETA to 07', () => {
      expect(
        TERMINATION_TYPE_TO_ESOCIAL_MOTIVO[TerminationType.RESCISAO_INDIRETA],
      ).toBe('07');
    });

    it('should map FALECIMENTO to 10', () => {
      expect(
        TERMINATION_TYPE_TO_ESOCIAL_MOTIVO[TerminationType.FALECIMENTO],
      ).toBe('10');
    });
  });

  describe('static helpers', () => {
    it('getEsocialMotivo should return correct code', () => {
      expect(S2299Builder.getEsocialMotivo(TerminationType.ACORDO_MUTUO)).toBe(
        '33',
      );
    });
  });
});
