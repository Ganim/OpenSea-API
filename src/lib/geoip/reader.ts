/**
 * Phase 9 / Plan 09-02 / D-03 — MaxMind GeoLite2-City reader singleton.
 *
 * Lazy-init: Reader.open() is async + costly (parses ~50MB .mmdb into in-memory
 * tree). Singleton ensures only 1 open per process. Graceful fallback if .mmdb
 * is missing (D-03 is audit-only — never blocks punch).
 *
 * @see https://github.com/maxmind/geoip2-node README
 */
import path from 'node:path';
import { existsSync } from 'node:fs';

import { Reader, AddressNotFoundError } from '@maxmind/geoip2-node';

let cityReader: Reader | null = null;
// Memoize negative result to avoid repeated fs hits when the .mmdb is absent.
let cityReaderInitFailed = false;

const DEFAULT_DB_PATH = path.resolve(process.cwd(), 'data/GeoLite2-City.mmdb');

export async function getCityReader(): Promise<Reader | null> {
  if (cityReader) return cityReader;
  if (cityReaderInitFailed) return null;

  const dbPath = process.env.GEOLITE2_CITY_PATH ?? DEFAULT_DB_PATH;
  if (!existsSync(dbPath)) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(
        `[GeoIP] GeoLite2-City.mmdb not found at ${dbPath}. IP geo lookup will be skipped (audit-only — punch flow not blocked).`,
      );
    }
    cityReaderInitFailed = true;
    return null;
  }

  try {
    cityReader = await Reader.open(dbPath);
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[GeoIP] City reader opened from ${dbPath}`);
    }
    return cityReader;
  } catch (err) {
    console.error('[GeoIP] Failed to open .mmdb:', (err as Error).message);
    cityReaderInitFailed = true;
    return null;
  }
}

export interface IpGeoLookup {
  /** ISO 3166-1 alpha-2 country code (e.g. 'BR'). */
  country: string | null;
  /** First-level subdivision ISO code (e.g. 'SP' for São Paulo). */
  region: string | null;
  /** City name (English locale). */
  city: string | null;
  /** Autonomous System Number — requires GeoLite2-ASN.mmdb (deferred). */
  asn: number | null;
}

/**
 * Looks up an IPv4/IPv6 address in the GeoLite2-City database.
 * Returns null when:
 *   - .mmdb is missing (graceful fallback for audit-only D-03)
 *   - IP is private/loopback (AddressNotFoundError swallowed)
 *   - reader.city throws any error (logged, not propagated — never blocks punch)
 */
export async function lookupIp(ip: string): Promise<IpGeoLookup | null> {
  const reader = await getCityReader();
  if (!reader) return null;

  try {
    const r = reader.city(ip);
    return {
      country: r.country?.isoCode ?? null,
      region: r.subdivisions?.[0]?.isoCode ?? null,
      city: r.city?.names?.en ?? null,
      asn: null, // ASN requires separate GeoLite2-ASN.mmdb — deferred
    };
  } catch (e) {
    if (e instanceof AddressNotFoundError) return null;
    if (process.env.NODE_ENV !== 'test') {
      console.warn('[GeoIP] lookupIp error:', (e as Error).message);
    }
    return null;
  }
}

/**
 * Test-only: reset singleton state between specs. Tagged with double-underscore
 * to avoid accidental production usage.
 */
export function __resetForTest(): void {
  cityReader = null;
  cityReaderInitFailed = false;
}

export { AddressNotFoundError };
