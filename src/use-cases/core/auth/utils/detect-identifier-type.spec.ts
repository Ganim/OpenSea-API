import { describe, expect, it } from 'vitest';
import {
  detectIdentifierType,
  normalizeIdentifier,
} from './detect-identifier-type';

describe('detectIdentifierType', () => {
  it('should detect email by @ symbol', () => {
    expect(detectIdentifierType('user@example.com')).toBe('EMAIL');
    expect(detectIdentifierType('admin@company.co')).toBe('EMAIL');
  });

  it('should detect CPF by 11 numeric digits (unformatted)', () => {
    expect(detectIdentifierType('12345678901')).toBe('CPF');
  });

  it('should detect CPF by 11 numeric digits (formatted)', () => {
    expect(detectIdentifierType('123.456.789-01')).toBe('CPF');
  });

  it('should detect enrollment for other patterns', () => {
    expect(detectIdentifierType('EMP-001')).toBe('ENROLLMENT');
    expect(detectIdentifierType('MAT12345')).toBe('ENROLLMENT');
    expect(detectIdentifierType('1234')).toBe('ENROLLMENT');
  });

  it('should trim whitespace before detection', () => {
    expect(detectIdentifierType('  user@example.com  ')).toBe('EMAIL');
    expect(detectIdentifierType('  12345678901  ')).toBe('CPF');
    expect(detectIdentifierType('  EMP-001  ')).toBe('ENROLLMENT');
  });
});

describe('normalizeIdentifier', () => {
  it('should lowercase email', () => {
    expect(normalizeIdentifier('EMAIL', 'User@Example.COM')).toBe(
      'user@example.com',
    );
  });

  it('should strip CPF formatting', () => {
    expect(normalizeIdentifier('CPF', '123.456.789-01')).toBe('12345678901');
  });

  it('should trim enrollment without other changes', () => {
    expect(normalizeIdentifier('ENROLLMENT', '  EMP-001  ')).toBe('EMP-001');
  });

  it('should trim whitespace for all types', () => {
    expect(normalizeIdentifier('EMAIL', '  user@test.com  ')).toBe(
      'user@test.com',
    );
    expect(normalizeIdentifier('CPF', '  12345678901  ')).toBe('12345678901');
  });
});
