import { describe, expect, it } from 'vitest';
import { maskAccountNumber, maskPixKey } from './mask-sensitive-data';

describe('maskAccountNumber', () => {
  it('should mask account number keeping last 4 digits', () => {
    expect(maskAccountNumber('12345678')).toBe('****5678');
  });

  it('should mask 6-digit account number', () => {
    expect(maskAccountNumber('123456')).toBe('**3456');
  });

  it('should not mask if 4 or fewer digits', () => {
    expect(maskAccountNumber('1234')).toBe('1234');
    expect(maskAccountNumber('123')).toBe('123');
  });
});

describe('maskPixKey', () => {
  it('should return null for null/undefined input', () => {
    expect(maskPixKey(null)).toBeNull();
    expect(maskPixKey(undefined)).toBeNull();
  });

  it('should mask email PIX key', () => {
    const masked = maskPixKey('guilherme@example.com');
    expect(masked).toBe('gui***@***.com');
  });

  it('should mask CPF PIX key (11 digits)', () => {
    const masked = maskPixKey('12345678901');
    expect(masked).toBe('***.***.***-01');
  });

  it('should mask CNPJ PIX key (14 digits)', () => {
    const masked = maskPixKey('12345678000190');
    expect(masked).toBe('**.***.***/**/**-90');
  });

  it('should mask phone PIX key', () => {
    const masked = maskPixKey('+5511999887766');
    expect(masked).toBe('+55********766');
  });

  it('should handle short keys without error', () => {
    const masked = maskPixKey('abc');
    expect(masked).toBe('abc');
  });
});
