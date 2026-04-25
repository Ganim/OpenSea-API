// Wave 0 stub — Phase 9 / Plan 09-01. Implementation arrives in Plan 09-02. See 09-VALIDATION.md.
//
// MaxMind GeoLite2 reader (D-03 IP geolocation cross-check, audit-only).
// Plan 09-02 implements `getCityReader()` singleton + lookup helpers
// in `OpenSea-API/src/lib/geoip/reader.ts` using `@maxmind/geoip2-node`.

import { describe, it, expect } from 'vitest';

describe('geoip reader (Plan 09-02 — Wave 0 stub)', () => {
  it('placeholder — Wave 0 RED gate; replaced in Plan 09-02', () => {
    expect(() => require('./reader')).toThrow();
  });

  it.skip('getCityReader é singleton (chamadas múltiplas retornam mesma instância)', () => {});
  it.skip('AddressNotFoundError → retorna null sem throw', () => {});
  it.skip('Reader.open só é chamado 1× (lazy init)', () => {});
});
