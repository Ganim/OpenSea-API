import { describe, it, expect } from 'vitest';
import { EsocialXmlBuilder } from './base-builder';

// Concrete test double to exercise abstract base class methods
class TestBuilder extends EsocialXmlBuilder<{ value: string }> {
  protected eventType = 'TEST';
  protected version = 'v1';

  build(input: { value: string }): string {
    return this.tag('test', input.value);
  }

  // Expose protected methods for testing
  public _escapeXml(s: string) {
    return this.escapeXml(s);
  }
  public _formatDate(d: Date | string) {
    return this.formatDate(d);
  }
  public _formatCPF(s: string) {
    return this.formatCPF(s);
  }
  public _formatCNPJ(s: string) {
    return this.formatCNPJ(s);
  }
  public _formatMoney(n: number) {
    return this.formatMoney(n);
  }
  public _formatCEP(s: string) {
    return this.formatCEP(s);
  }
  public _tag(
    name: string,
    value: string | number | boolean | null | undefined,
  ) {
    return this.tag(name, value);
  }
  public _tagGroup(name: string, content: string) {
    return this.tagGroup(name, content);
  }
  public _generateEventId(tpInsc: number, nrInsc: string, seq?: number) {
    return this.generateEventId(tpInsc, nrInsc, seq);
  }
  public _buildIdeEvento(indRetif?: 1 | 2, tpAmb?: 1 | 2, nrRecibo?: string) {
    return this.buildIdeEvento(indRetif, tpAmb, nrRecibo);
  }
  public _buildIdeEmpregador(tpInsc: number, nrInsc: string) {
    return this.buildIdeEmpregador(tpInsc, nrInsc);
  }
  public _xmlHeader() {
    return this.xmlHeader();
  }
}

describe('EsocialXmlBuilder (base)', () => {
  const builder = new TestBuilder();

  describe('escapeXml', () => {
    it('should escape all XML special characters', () => {
      expect(builder._escapeXml('a & b < c > d " e \' f')).toBe(
        'a &amp; b &lt; c &gt; d &quot; e &apos; f',
      );
    });

    it('should return the same string when no special characters', () => {
      expect(builder._escapeXml('hello world')).toBe('hello world');
    });
  });

  describe('formatDate', () => {
    it('should format a Date object to YYYY-MM-DD in BRT', () => {
      // 12:00 UTC = 09:00 BRT of the same civil day → no shift.
      const date = new Date('2026-03-25T12:00:00Z');
      expect(builder._formatDate(date)).toBe('2026-03-25');
    });

    it('should format an ISO string to YYYY-MM-DD in BRT', () => {
      // 00:00 UTC = 21:00 BRT of the *previous* civil day.
      // eSocial expects the BRT civil day (2026-01-14), not the UTC day
      // (2026-01-15). This is the P0-10 fix — using toISOString() would
      // have returned "2026-01-15" and shifted admissions/terminations
      // into the wrong civil day for the government.
      expect(builder._formatDate('2026-01-15T00:00:00.000Z')).toBe(
        '2026-01-14',
      );
    });

    it('should preserve the BRT civil day for late-night instants around midnight', () => {
      // 2026-06-30 23:30 BRT = 2026-07-01 02:30 UTC. eSocial must see
      // "2026-06-30" — the day the termination actually happened in
      // Brasília — or else rescission pay is computed for the wrong
      // month (P0-10).
      const lateNightBRT = new Date('2026-07-01T02:30:00.000Z');
      expect(builder._formatDate(lateNightBRT)).toBe('2026-06-30');
    });

    it('should accept a pure YYYY-MM-DD string without timezone shifting', () => {
      // A bare date string parses as UTC midnight → BRT 21:00 of the
      // previous day. Callers are expected to pass full timestamps; when
      // they only have a day, this documents the behaviour so no one is
      // surprised later.
      expect(builder._formatDate('2026-01-15')).toBe('2026-01-14');
    });
  });

  describe('formatCPF', () => {
    it('should strip non-digit characters and pad to 11', () => {
      expect(builder._formatCPF('123.456.789-09')).toBe('12345678909');
    });

    it('should pad short numbers', () => {
      expect(builder._formatCPF('123')).toBe('00000000123');
    });
  });

  describe('formatCNPJ', () => {
    it('should strip non-digits and pad to 14', () => {
      expect(builder._formatCNPJ('12.345.678/0001-95')).toBe('12345678000195');
    });
  });

  describe('formatMoney', () => {
    it('should format to 2 decimal places', () => {
      expect(builder._formatMoney(5000)).toBe('5000.00');
      expect(builder._formatMoney(1234.5)).toBe('1234.50');
      expect(builder._formatMoney(99.999)).toBe('100.00');
    });
  });

  describe('formatCEP', () => {
    it('should strip non-digits and pad to 8', () => {
      expect(builder._formatCEP('01000-000')).toBe('01000000');
    });
  });

  describe('tag', () => {
    it('should emit a tag with string value', () => {
      expect(builder._tag('nome', 'João')).toBe('<nome>João</nome>');
    });

    it('should emit a tag with numeric value', () => {
      expect(builder._tag('cod', 42)).toBe('<cod>42</cod>');
    });

    it('should return empty for null, undefined, or empty string', () => {
      expect(builder._tag('x', null)).toBe('');
      expect(builder._tag('x', undefined)).toBe('');
      expect(builder._tag('x', '')).toBe('');
    });

    it('should escape XML characters in value', () => {
      expect(builder._tag('desc', 'A & B')).toBe('<desc>A &amp; B</desc>');
    });
  });

  describe('tagGroup', () => {
    it('should wrap content in a tag', () => {
      expect(builder._tagGroup('group', '<a>1</a>')).toBe(
        '<group><a>1</a></group>',
      );
    });

    it('should return empty when content is whitespace-only', () => {
      expect(builder._tagGroup('group', '   ')).toBe('');
    });
  });

  describe('generateEventId', () => {
    it('should start with ID followed by tpInsc', () => {
      const id = builder._generateEventId(1, '12345678000195');
      expect(id).toMatch(/^ID1/);
    });

    it('should contain the padded CNPJ after tpInsc', () => {
      const id = builder._generateEventId(1, '12345678000195');
      // ID + tpInsc(1 digit) + nrInsc(14 digits) = positions 3..17
      expect(id.substring(3, 17)).toBe('12345678000195');
    });

    it('should end with 5-digit sequence number', () => {
      const id = builder._generateEventId(1, '12345678000195', 3);
      expect(id).toMatch(/00003$/);
    });
  });

  describe('buildIdeEvento', () => {
    it('should contain default values for original event', () => {
      const xml = builder._buildIdeEvento();
      expect(xml).toContain('<indRetif>1</indRetif>');
      expect(xml).toContain('<tpAmb>2</tpAmb>');
      expect(xml).toContain('<procEmi>1</procEmi>');
      expect(xml).toContain('<verProc>OpenSea-1.0</verProc>');
      expect(xml).not.toContain('nrRecibo');
    });

    it('should include nrRecibo for retificacao', () => {
      const xml = builder._buildIdeEvento(2, 1, 'REC123');
      expect(xml).toContain('<indRetif>2</indRetif>');
      expect(xml).toContain('<nrRecibo>REC123</nrRecibo>');
      expect(xml).toContain('<tpAmb>1</tpAmb>');
    });
  });

  describe('buildIdeEmpregador', () => {
    it('should format CNPJ for tpInsc=1', () => {
      const xml = builder._buildIdeEmpregador(1, '12345678000195');
      expect(xml).toContain('<tpInsc>1</tpInsc>');
      expect(xml).toContain('<nrInsc>12345678000195</nrInsc>');
    });

    it('should format CPF for tpInsc=2', () => {
      const xml = builder._buildIdeEmpregador(2, '12345678909');
      expect(xml).toContain('<tpInsc>2</tpInsc>');
      expect(xml).toContain('<nrInsc>12345678909</nrInsc>');
    });
  });

  describe('xmlHeader', () => {
    it('should return standard XML declaration', () => {
      expect(builder._xmlHeader()).toBe(
        '<?xml version="1.0" encoding="UTF-8"?>',
      );
    });
  });
});
