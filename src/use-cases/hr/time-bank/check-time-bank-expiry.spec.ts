import { describe, expect, it } from 'vitest';
import {
  checkTimeBankExpiry,
  findExpiredTimeBanks,
  getTimeBankExpirationDate,
  type TimeBankEntry,
} from './check-time-bank-expiry';

function makeEntry(overrides: Partial<TimeBankEntry> = {}): TimeBankEntry {
  return {
    id: 'entry-1',
    employeeId: 'emp-1',
    balance: 10,
    year: 2026,
    agreementType: 'INDIVIDUAL',
    expirationDate: null,
    createdAt: new Date('2026-01-01'),
    ...overrides,
  };
}

describe('getTimeBankExpirationDate', () => {
  it('should return explicit expirationDate when set', () => {
    const explicit = new Date('2026-12-31');
    const entry = makeEntry({ expirationDate: explicit });
    const result = getTimeBankExpirationDate(entry);
    expect(result.getTime()).toBe(explicit.getTime());
  });

  it('should calculate 6 months for INDIVIDUAL agreement', () => {
    const createdAt = new Date(2026, 0, 15); // Jan 15 local
    const entry = makeEntry({
      agreementType: 'INDIVIDUAL',
      createdAt,
    });
    const result = getTimeBankExpirationDate(entry);
    const expected = new Date(createdAt);
    expected.setMonth(expected.getMonth() + 6);
    expect(result.getTime()).toBe(expected.getTime());
  });

  it('should calculate 12 months for COLLECTIVE agreement', () => {
    const createdAt = new Date(2026, 0, 15); // Jan 15 local
    const entry = makeEntry({
      agreementType: 'COLLECTIVE',
      createdAt,
    });
    const result = getTimeBankExpirationDate(entry);
    const expected = new Date(createdAt);
    expected.setMonth(expected.getMonth() + 12);
    expect(result.getTime()).toBe(expected.getTime());
  });

  it('should use custom validity months when provided', () => {
    const createdAt = new Date(2026, 0, 15); // Jan 15 local
    const entry = makeEntry({ createdAt });
    const result = getTimeBankExpirationDate(entry, 3);
    const expected = new Date(createdAt);
    expected.setMonth(expected.getMonth() + 3);
    expect(result.getTime()).toBe(expected.getTime());
  });
});

describe('checkTimeBankExpiry', () => {
  it('should return not expired when within validity', () => {
    const entry = makeEntry({ createdAt: new Date('2026-01-01') });
    const refDate = new Date('2026-03-01');
    const result = checkTimeBankExpiry(entry, refDate);
    expect(result.isExpired).toBe(false);
    expect(result.overtimePayable).toBe(0);
    expect(result.balanceForgiven).toBe(0);
    expect(result.message).toContain('válido');
  });

  it('should detect expired entry with positive balance (overtime payable)', () => {
    const entry = makeEntry({
      balance: 15.5,
      createdAt: new Date('2025-01-01'),
    });
    const refDate = new Date('2026-01-01');
    const result = checkTimeBankExpiry(entry, refDate);
    expect(result.isExpired).toBe(true);
    expect(result.overtimePayable).toBe(15.5);
    expect(result.balanceForgiven).toBe(0);
    expect(result.message).toContain('hora extra');
  });

  it('should detect expired entry with negative balance (forgiven)', () => {
    const entry = makeEntry({
      balance: -8.25,
      createdAt: new Date('2025-01-01'),
    });
    const refDate = new Date('2026-01-01');
    const result = checkTimeBankExpiry(entry, refDate);
    expect(result.isExpired).toBe(true);
    expect(result.overtimePayable).toBe(0);
    expect(result.balanceForgiven).toBe(8.25);
    expect(result.message).toContain('perdoadas');
  });

  it('should handle expired entry with zero balance', () => {
    const entry = makeEntry({
      balance: 0,
      createdAt: new Date('2025-01-01'),
    });
    const refDate = new Date('2026-01-01');
    const result = checkTimeBankExpiry(entry, refDate);
    expect(result.isExpired).toBe(true);
    expect(result.overtimePayable).toBe(0);
    expect(result.balanceForgiven).toBe(0);
    expect(result.message).toContain('Saldo zero');
  });

  it('should use custom validity months', () => {
    const entry = makeEntry({
      balance: 5,
      createdAt: new Date('2026-01-01'),
    });
    // With 2 months validity, March 1 should be expired
    const refDate = new Date('2026-03-15');
    const result = checkTimeBankExpiry(entry, refDate, 2);
    expect(result.isExpired).toBe(true);
    expect(result.overtimePayable).toBe(5);
  });

  it('should round overtime payable to 2 decimal places', () => {
    const entry = makeEntry({
      balance: 10.333333,
      createdAt: new Date('2025-01-01'),
    });
    const refDate = new Date('2026-01-01');
    const result = checkTimeBankExpiry(entry, refDate);
    expect(result.overtimePayable).toBe(10.33);
  });
});

describe('findExpiredTimeBanks', () => {
  it('should return only expired entries', () => {
    const entries: TimeBankEntry[] = [
      makeEntry({ id: 'e1', balance: 5, createdAt: new Date('2025-01-01') }),
      makeEntry({ id: 'e2', balance: 3, createdAt: new Date('2026-03-01') }),
    ];
    const refDate = new Date('2026-04-01');
    const result = findExpiredTimeBanks(entries, refDate);
    expect(result).toHaveLength(1);
    expect(result[0].entry.id).toBe('e1');
  });

  it('should return empty array when no entries are expired', () => {
    const entries: TimeBankEntry[] = [
      makeEntry({ id: 'e1', createdAt: new Date('2026-03-01') }),
    ];
    const refDate = new Date('2026-04-01');
    const result = findExpiredTimeBanks(entries, refDate);
    expect(result).toHaveLength(0);
  });

  it('should apply custom validity per agreement type', () => {
    const entries: TimeBankEntry[] = [
      makeEntry({
        id: 'e1',
        agreementType: 'INDIVIDUAL',
        balance: 5,
        createdAt: new Date('2026-01-01'),
      }),
      makeEntry({
        id: 'e2',
        agreementType: 'COLLECTIVE',
        balance: 3,
        createdAt: new Date('2026-01-01'),
      }),
    ];
    const refDate = new Date('2026-04-01');
    // Individual with 2 months validity → expired; Collective with default 12 → not expired
    const result = findExpiredTimeBanks(entries, refDate, { INDIVIDUAL: 2 });
    expect(result).toHaveLength(1);
    expect(result[0].entry.id).toBe('e1');
  });

  it('should handle empty entries list', () => {
    const result = findExpiredTimeBanks([], new Date());
    expect(result).toHaveLength(0);
  });
});
