import { describe, expect, it } from 'vitest';
import {
  maskBankAccount,
  maskCPF,
  maskCTPS,
  maskEmail,
  maskFullName,
  maskPhone,
  maskPIS,
  maskRG,
} from './mask-employee-data';

describe('maskCPF', () => {
  it('returns null for null/undefined/empty input', () => {
    expect(maskCPF(null)).toBeNull();
    expect(maskCPF(undefined)).toBeNull();
    expect(maskCPF('')).toBeNull();
  });

  it('masks raw 11-digit CPF preserving first 3 and last 2 digits', () => {
    expect(maskCPF('12345678989')).toBe('123.***.***-89');
  });

  it('masks formatted CPF', () => {
    expect(maskCPF('123.456.789-89')).toBe('123.***.***-89');
  });

  it('returns the input unchanged when length is invalid', () => {
    expect(maskCPF('123')).toBe('123');
  });
});

describe('maskRG', () => {
  it('returns null for empty input', () => {
    expect(maskRG(null)).toBeNull();
    expect(maskRG(undefined)).toBeNull();
    expect(maskRG('')).toBeNull();
  });

  it('masks 9-digit RG keeping last 3 digits', () => {
    expect(maskRG('123456789')).toBe('**.***.789');
  });

  it('masks formatted RG keeping last 3 digits', () => {
    expect(maskRG('12.345.678-9')).toBe('**.***.789');
  });

  it('falls back to generic mask for non-standard length', () => {
    expect(maskRG('1234567')).toBe('****567');
  });

  it('preserves very short values', () => {
    expect(maskRG('12')).toBe('12');
  });
});

describe('maskCTPS', () => {
  it('returns null for empty input', () => {
    expect(maskCTPS(null)).toBeNull();
    expect(maskCTPS(undefined)).toBeNull();
  });

  it('masks CTPS keeping last 4 digits', () => {
    expect(maskCTPS('001234')).toBe('**1234');
  });

  it('preserves short CTPS untouched', () => {
    expect(maskCTPS('1234')).toBe('1234');
  });
});

describe('maskPIS', () => {
  it('returns null for empty input', () => {
    expect(maskPIS(null)).toBeNull();
    expect(maskPIS(undefined)).toBeNull();
  });

  it('masks 11-digit PIS preserving last block and check digit', () => {
    // 12345678901 -> *** **** 890 - 1
    expect(maskPIS('12345678901')).toBe('***.****.890-1');
  });

  it('masks formatted PIS', () => {
    expect(maskPIS('123.4567.890-1')).toBe('***.****.890-1');
  });

  it('returns input unchanged when length is invalid', () => {
    expect(maskPIS('123')).toBe('123');
  });
});

describe('maskBankAccount', () => {
  it('returns null for empty input', () => {
    expect(maskBankAccount(null)).toBeNull();
    expect(maskBankAccount(undefined)).toBeNull();
  });

  it('masks account keeping last 4 digits', () => {
    expect(maskBankAccount('125678')).toBe('**5678');
  });

  it('preserves short accounts untouched', () => {
    expect(maskBankAccount('1234')).toBe('1234');
  });
});

describe('maskEmail', () => {
  it('returns null for empty input', () => {
    expect(maskEmail(null)).toBeNull();
    expect(maskEmail(undefined)).toBeNull();
  });

  it('masks email keeping first letter of local part and full domain', () => {
    expect(maskEmail('joao.silva@example.com')).toBe('j***@example.com');
  });

  it('handles single-letter local parts', () => {
    expect(maskEmail('j@example.com')).toBe('j***@example.com');
  });

  it('returns trimmed value when missing @', () => {
    expect(maskEmail('not-an-email')).toBe('not-an-email');
  });
});

describe('maskPhone', () => {
  it('returns null for empty input', () => {
    expect(maskPhone(null)).toBeNull();
    expect(maskPhone(undefined)).toBeNull();
  });

  it('masks 11-digit mobile keeping DDD and last 4 digits', () => {
    expect(maskPhone('11999991234')).toBe('(11) *****-1234');
  });

  it('masks 10-digit landline keeping DDD and last 4 digits', () => {
    expect(maskPhone('1133331234')).toBe('(11) ****-1234');
  });

  it('masks already-formatted phone numbers', () => {
    expect(maskPhone('(11) 99999-1234')).toBe('(11) *****-1234');
  });

  it('falls back to generic mask for non-standard length', () => {
    expect(maskPhone('5511999991234')).toBe('*********1234');
  });
});

describe('maskFullName', () => {
  it('returns null for empty input', () => {
    expect(maskFullName(null)).toBeNull();
    expect(maskFullName(undefined)).toBeNull();
    expect(maskFullName('   ')).toBeNull();
  });

  it('masks each word preserving the first letter', () => {
    expect(maskFullName('Joao Silva')).toBe('J*** S***');
  });

  it('preserves single-letter words intact', () => {
    expect(maskFullName('Maria A Silva')).toBe('M*** A S***');
  });

  it('collapses multiple whitespace separators', () => {
    expect(maskFullName('  Joao   Silva  ')).toBe('J*** S***');
  });
});
