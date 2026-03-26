import { describe, it, expect } from 'vitest';
import {
  extractTag,
  extractTagAsNumber,
  extractAllGroups,
  extractGroup,
  unescapeXml,
} from './base-parser';

describe('Base Parser Utilities', () => {
  describe('extractTag', () => {
    it('should extract text content from a tag', () => {
      const xml = '<cpfTrab>12345678909</cpfTrab>';
      expect(extractTag(xml, 'cpfTrab')).toBe('12345678909');
    });

    it('should return null when tag is not found', () => {
      const xml = '<cpfTrab>12345678909</cpfTrab>';
      expect(extractTag(xml, 'nrInsc')).toBeNull();
    });

    it('should extract first occurrence of a tag', () => {
      const xml = '<valor>100.00</valor><valor>200.00</valor>';
      expect(extractTag(xml, 'valor')).toBe('100.00');
    });

    it('should handle empty tag content', () => {
      const xml = '<cpfTrab></cpfTrab>';
      expect(extractTag(xml, 'cpfTrab')).toBe('');
    });
  });

  describe('extractTagAsNumber', () => {
    it('should extract and parse a numeric value', () => {
      const xml = '<vrCpSeg>450.50</vrCpSeg>';
      expect(extractTagAsNumber(xml, 'vrCpSeg')).toBe(450.5);
    });

    it('should return null when tag is not found', () => {
      expect(extractTagAsNumber('<a>1</a>', 'b')).toBeNull();
    });

    it('should return null for non-numeric content', () => {
      const xml = '<vrCpSeg>abc</vrCpSeg>';
      expect(extractTagAsNumber(xml, 'vrCpSeg')).toBeNull();
    });

    it('should handle integer values', () => {
      const xml = '<codCateg>101</codCateg>';
      expect(extractTagAsNumber(xml, 'codCateg')).toBe(101);
    });
  });

  describe('extractAllGroups', () => {
    it('should extract all occurrences of a group', () => {
      const xml = '<item><a>1</a></item><item><a>2</a></item>';
      const groups = extractAllGroups(xml, 'item');

      expect(groups).toHaveLength(2);
      expect(groups[0]).toContain('<a>1</a>');
      expect(groups[1]).toContain('<a>2</a>');
    });

    it('should return empty array when no groups found', () => {
      const xml = '<other>test</other>';
      expect(extractAllGroups(xml, 'item')).toEqual([]);
    });

    it('should handle single group', () => {
      const xml = '<item><a>1</a></item>';
      const groups = extractAllGroups(xml, 'item');

      expect(groups).toHaveLength(1);
      expect(groups[0]).toContain('<a>1</a>');
    });
  });

  describe('extractGroup', () => {
    it('should extract the first group', () => {
      const xml = '<wrapper><inner>data</inner></wrapper>';
      const group = extractGroup(xml, 'wrapper');

      expect(group).toBe('<inner>data</inner>');
    });

    it('should return null when group not found', () => {
      expect(extractGroup('<a>b</a>', 'missing')).toBeNull();
    });
  });

  describe('unescapeXml', () => {
    it('should unescape XML entities', () => {
      expect(unescapeXml('&amp;')).toBe('&');
      expect(unescapeXml('&lt;')).toBe('<');
      expect(unescapeXml('&gt;')).toBe('>');
      expect(unescapeXml('&quot;')).toBe('"');
      expect(unescapeXml('&apos;')).toBe("'");
    });

    it('should handle combined entities', () => {
      expect(unescapeXml('A &amp; B &lt; C')).toBe('A & B < C');
    });
  });
});
