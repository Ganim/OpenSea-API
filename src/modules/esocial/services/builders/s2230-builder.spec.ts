import { describe, it, expect } from 'vitest';
import {
  S2230Builder,
  ABSENCE_TYPE_TO_ESOCIAL_MOTIVO,
} from './s2230-builder';
import type { S2230Input } from './s2230-builder';

describe('S2230Builder', () => {
  const builder = new S2230Builder();

  const baseInput: S2230Input = {
    tpInsc: 1,
    nrInsc: '12345678000195',
    cpfTrab: '12345678909',
    matricula: 'EMP001',
    dtIniAfast: new Date('2026-05-10'),
    codMotAfast: '03', // Doença
    codCID: 'J11',
  };

  it('should generate valid S-2230 XML with correct namespace', () => {
    const xml = builder.build(baseInput);

    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(xml).toContain(
      'xmlns="http://www.esocial.gov.br/schema/evt/evtAfastTemp/vS_01_02_00"',
    );
    expect(xml).toMatch(/<evtAfastTemp Id="ID1/);
  });

  it('should include ideVinculo', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<ideVinculo>');
    expect(xml).toContain('<cpfTrab>12345678909</cpfTrab>');
    expect(xml).toContain('<matricula>EMP001</matricula>');
  });

  it('should include iniAfastamento with motivo and CID', () => {
    const xml = builder.build(baseInput);

    expect(xml).toContain('<infoAfastamento>');
    expect(xml).toContain('<iniAfastamento>');
    expect(xml).toContain('<dtIniAfast>2026-05-10</dtIniAfast>');
    expect(xml).toContain('<codMotAfast>03</codMotAfast>');
    expect(xml).toContain('<codCID>J11</codCID>');
  });

  it('should omit fimAfastamento when dtTermAfast is not provided', () => {
    const xml = builder.build(baseInput);
    expect(xml).not.toContain('<fimAfastamento>');
  });

  it('should include fimAfastamento when dtTermAfast is provided', () => {
    const input: S2230Input = {
      ...baseInput,
      dtTermAfast: new Date('2026-05-20'),
    };
    const xml = builder.build(input);

    expect(xml).toContain('<fimAfastamento>');
    expect(xml).toContain('<dtTermAfast>2026-05-20</dtTermAfast>');
  });

  it('should omit codCID when not provided', () => {
    const input: S2230Input = {
      ...baseInput,
      codCID: undefined,
    };
    const xml = builder.build(input);
    expect(xml).not.toContain('<codCID>');
  });

  describe('ABSENCE_TYPE_TO_ESOCIAL_MOTIVO', () => {
    it('should map SICK_LEAVE to 03', () => {
      expect(ABSENCE_TYPE_TO_ESOCIAL_MOTIVO.SICK_LEAVE).toBe('03');
    });

    it('should map MATERNITY_LEAVE to 06', () => {
      expect(ABSENCE_TYPE_TO_ESOCIAL_MOTIVO.MATERNITY_LEAVE).toBe('06');
    });

    it('should map PATERNITY_LEAVE to 15', () => {
      expect(ABSENCE_TYPE_TO_ESOCIAL_MOTIVO.PATERNITY_LEAVE).toBe('15');
    });

    it('should map VACATION to 21', () => {
      expect(ABSENCE_TYPE_TO_ESOCIAL_MOTIVO.VACATION).toBe('21');
    });

    it('should map WORK_ACCIDENT to 01', () => {
      expect(ABSENCE_TYPE_TO_ESOCIAL_MOTIVO.WORK_ACCIDENT).toBe('01');
    });

    it('should map MILITARY_SERVICE to 10', () => {
      expect(ABSENCE_TYPE_TO_ESOCIAL_MOTIVO.MILITARY_SERVICE).toBe('10');
    });

    it('should map UNPAID_LEAVE to 24', () => {
      expect(ABSENCE_TYPE_TO_ESOCIAL_MOTIVO.UNPAID_LEAVE).toBe('24');
    });
  });

  describe('static helpers', () => {
    it('getEsocialMotivo should return code for reportable types', () => {
      expect(S2230Builder.getEsocialMotivo('SICK_LEAVE')).toBe('03');
    });

    it('getEsocialMotivo should return undefined for non-reportable types', () => {
      expect(S2230Builder.getEsocialMotivo('PERSONAL_LEAVE')).toBeUndefined();
    });

    it('isReportableAbsence should return true for reportable types', () => {
      expect(S2230Builder.isReportableAbsence('VACATION')).toBe(true);
      expect(S2230Builder.isReportableAbsence('SICK_LEAVE')).toBe(true);
    });

    it('isReportableAbsence should return false for non-reportable types', () => {
      expect(S2230Builder.isReportableAbsence('BEREAVEMENT_LEAVE')).toBe(
        false,
      );
      expect(S2230Builder.isReportableAbsence('WEDDING_LEAVE')).toBe(false);
    });
  });
});
