import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

/**
 * SSRF Protection for Email Hosts
 *
 * Validates SMTP/IMAP hosts to prevent Server-Side Request Forgery (SSRF).
 * Blocks private/reserved IP ranges that could be used to scan internal networks,
 * access cloud metadata services (169.254.169.254), or probe internal services.
 */

const BLOCKED_IPV4_RANGES = [
  { prefix: '0.', label: 'this-network' },
  { prefix: '10.', label: 'private-class-a' },
  { prefix: '127.', label: 'loopback' },
  { prefix: '169.254.', label: 'link-local' },
  { prefix: '192.168.', label: 'private-class-c' },
];

/**
 * Check if an IPv4 address is in the 172.16.0.0/12 private range (172.16.x.x - 172.31.x.x)
 */
function isPrivate172(ip: string): boolean {
  if (!ip.startsWith('172.')) return false;
  const second = Number.parseInt(ip.split('.')[1], 10);
  return second >= 16 && second <= 31;
}

/**
 * Returns true if the IP is in a private/reserved range that should be blocked.
 */
function isBlockedIp(ip: string): boolean {
  for (const range of BLOCKED_IPV4_RANGES) {
    if (ip.startsWith(range.prefix)) return true;
  }
  if (isPrivate172(ip)) return true;

  // Block IPv6 loopback and link-local
  if (ip === '::1' || ip.startsWith('fe80:') || ip.startsWith('fc00:') || ip.startsWith('fd')) {
    return true;
  }

  return false;
}

/** Allowed SMTP/IMAP port ranges for email services */
const ALLOWED_PORTS = new Set([25, 110, 143, 465, 587, 993, 995, 2525]);

/**
 * Validates an email host (SMTP or IMAP) for SSRF protection.
 *
 * Checks:
 * 1. If the host is a raw IP, blocks private/reserved ranges
 * 2. If the host is a domain, resolves it and blocks private/reserved IPs
 * 3. Blocks localhost variants
 *
 * @returns `true` if the host is safe, `false` if blocked
 */
export async function isEmailHostSafe(host: string): Promise<boolean> {
  const normalized = host.trim().toLowerCase();

  // Block explicit localhost
  if (normalized === 'localhost' || normalized === 'localhost.localdomain') {
    return false;
  }

  // If it's a raw IP address, validate directly
  if (isIP(normalized)) {
    return !isBlockedIp(normalized);
  }

  // Resolve the domain and check the resulting IP
  try {
    const { address } = await lookup(normalized, { family: 4 });
    return !isBlockedIp(address);
  } catch {
    // DNS resolution failed — could be a typo or internal hostname
    // Block by default for safety (fail-closed)
    return false;
  }
}

/**
 * Validates an email port is in the expected range for SMTP/IMAP.
 */
export function isEmailPortValid(port: number): boolean {
  return ALLOWED_PORTS.has(port);
}

/**
 * Synchronous check for obviously bad hosts (raw IPs, localhost).
 * Use this for Zod `.refine()` since it needs to be fast.
 * The async `isEmailHostSafe` should be called in the use case for full DNS validation.
 */
export function isEmailHostObviouslySafe(host: string): boolean {
  const normalized = host.trim().toLowerCase();

  if (normalized === 'localhost' || normalized === 'localhost.localdomain') {
    return false;
  }

  if (isIP(normalized)) {
    return !isBlockedIp(normalized);
  }

  // Domain names pass the sync check — full DNS validation happens async
  return true;
}
