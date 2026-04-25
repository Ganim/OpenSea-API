// Phase 9 / Plan 09-02 — MaxMind GeoLite2 reader spec (RED→GREEN from Wave 0 stub).
//
// PUNCH-FRAUD-01 (D-03 IP geolocation cross-check, audit-only).

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock @maxmind/geoip2-node to avoid touching fs / native deps
const mockReaderInstance = {
  city: vi.fn(),
};
const mockReaderOpen = vi.fn(async () => mockReaderInstance);

vi.mock('@maxmind/geoip2-node', () => ({
  Reader: { open: mockReaderOpen },
  AddressNotFoundError: class AddressNotFoundError extends Error {
    name = 'AddressNotFoundError';
  },
}));

vi.mock('node:fs', () => ({ existsSync: vi.fn(() => true) }));

describe('GeoIP reader singleton (Plan 09-02)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockReaderInstance.city.mockReset();
    const fs = await import('node:fs');
    (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(true);
    const mod = await import('./reader');
    mod.__resetForTest();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('opens .mmdb file lazily on first call (singleton)', async () => {
    const { getCityReader } = await import('./reader');
    await getCityReader();
    await getCityReader();
    await getCityReader();
    expect(mockReaderOpen).toHaveBeenCalledTimes(1);
  });

  it('returns null when .mmdb missing (graceful fallback)', async () => {
    const fs = await import('node:fs');
    (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);
    const { getCityReader, __resetForTest } = await import('./reader');
    __resetForTest();
    const reader = await getCityReader();
    expect(reader).toBeNull();
  });

  it('lookupIp returns null on AddressNotFoundError (no throw)', async () => {
    const { lookupIp, AddressNotFoundError } = await import('./reader');
    mockReaderInstance.city.mockImplementation(() => {
      throw new AddressNotFoundError('not found');
    });
    const result = await lookupIp('192.0.2.1');
    expect(result).toBeNull();
  });

  it('lookupIp returns { country, region, city } on success', async () => {
    const { lookupIp } = await import('./reader');
    mockReaderInstance.city.mockReturnValue({
      country: { isoCode: 'BR' },
      subdivisions: [{ isoCode: 'SP' }],
      city: { names: { en: 'São Paulo' } },
    });
    const result = await lookupIp('200.100.50.25');
    expect(result).toEqual({
      country: 'BR',
      region: 'SP',
      city: 'São Paulo',
      asn: null,
    });
  });
});
