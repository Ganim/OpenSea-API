import { describe, it, expect } from 'vitest';
import { truncateContent } from './pdf-extractor';

describe('PDF Extractor', () => {
  describe('truncateContent()', () => {
    it('should truncate long text', () => {
      const longContent = 'a'.repeat(50_000);

      const result = truncateContent(longContent);

      expect(result.length).toBeLessThan(longContent.length);
      expect(result).toContain('[... documento truncado ...]');
    });

    it('should preserve short text', () => {
      const shortContent = 'This is a short document content.';

      const result = truncateContent(shortContent);

      expect(result).toBe(shortContent);
      expect(result).not.toContain('[... documento truncado ...]');
    });

    it('should handle empty input', () => {
      const result = truncateContent('');

      expect(result).toBe('');
      expect(result).not.toContain('[... documento truncado ...]');
    });

    it('should preserve text exactly at the limit', () => {
      const exactContent = 'a'.repeat(30_000);

      const result = truncateContent(exactContent);

      expect(result).toBe(exactContent);
      expect(result).not.toContain('[... documento truncado ...]');
    });

    it('should truncate text just over the limit', () => {
      const overLimitContent = 'a'.repeat(30_001);

      const result = truncateContent(overLimitContent);

      expect(result).toContain('[... documento truncado ...]');
      // The truncated text starts with 30000 'a' chars
      expect(result.startsWith('a'.repeat(30_000))).toBe(true);
    });
  });
});
