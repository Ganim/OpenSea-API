/**
 * Anti-SSRF defense — Phase 11 / Plan 11-02 / D-31.
 *
 * Defesa em camadas para outbound webhook delivery:
 *   1. HTTPS-only em produção (rejeita http://)
 *   2. Blocklist de IPs privados/loopback/link-local IPv4 + IPv6
 *   3. DNS rebinding mitigation: resolve hostname e rejeita se *qualquer* IP
 *      retornado for privado (TOCTOU 2-pass — V1 simplification A6).
 *
 * O worker chama `validateWebhookUrlOrThrow` antes de cada fetch (não apenas
 * na criação) — o DNS pode mudar entre o cadastro e a delivery (rebinding
 * attack).
 *
 * AWS metadata endpoint (169.254.169.254) é explicitamente bloqueado via
 * link-local range 169.254/16.
 */
import { promises as dns } from 'node:dns';

// Lazy import @/@env to avoid initialization in unit tests where JWT_SECRET / DATABASE_URL
// are not provided. Lib functions accept `isProduction` explicitly OR fall back to NODE_ENV.
function getIsProductionDefault(): boolean {
  // Avoid `@/@env` import (Zod parse with required envs); read process.env directly
  return process.env.NODE_ENV === 'production';
}

// ─── IPv4 private/loopback/link-local ranges ─────────────────────────────────
//
// Cada range é [start, end] em octetos numéricos comparáveis.
const PRIVATE_IPV4_RANGES: ReadonlyArray<[number, number]> = [
  // 0.0.0.0/8 — "this host"
  [0x00_00_00_00, 0x00_ff_ff_ff],
  // 10.0.0.0/8 — RFC 1918 private
  [0x0a_00_00_00, 0x0a_ff_ff_ff],
  // 100.64.0.0/10 — RFC 6598 carrier-grade NAT
  [0x64_40_00_00, 0x64_7f_ff_ff],
  // 127.0.0.0/8 — loopback
  [0x7f_00_00_00, 0x7f_ff_ff_ff],
  // 169.254.0.0/16 — link-local + AWS metadata 169.254.169.254 (T-11-08)
  [0xa9_fe_00_00, 0xa9_fe_ff_ff],
  // 172.16.0.0/12 — RFC 1918 private
  [0xac_10_00_00, 0xac_1f_ff_ff],
  // 192.0.0.0/24 — IETF protocol assignments
  [0xc0_00_00_00, 0xc0_00_00_ff],
  // 192.168.0.0/16 — RFC 1918 private
  [0xc0_a8_00_00, 0xc0_a8_ff_ff],
  // 198.18.0.0/15 — benchmark
  [0xc6_12_00_00, 0xc6_13_ff_ff],
  // 224.0.0.0/4 — multicast
  [0xe0_00_00_00, 0xef_ff_ff_ff],
  // 240.0.0.0/4 — reserved
  [0xf0_00_00_00, 0xff_ff_ff_ff],
];

function ipv4ToNumber(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let n = 0;
  for (const part of parts) {
    const oct = Number.parseInt(part, 10);
    if (!Number.isInteger(oct) || oct < 0 || oct > 255) return null;
    n = (n << 8) | oct;
  }
  // Force unsigned 32-bit
  return n >>> 0;
}

export function isPrivateIPv4(ip: string): boolean {
  const num = ipv4ToNumber(ip);
  if (num === null) return false;
  for (const [start, end] of PRIVATE_IPV4_RANGES) {
    if (num >= start && num <= end) return true;
  }
  return false;
}

// ─── IPv6 private/loopback/link-local ranges ─────────────────────────────────
//
// Match por prefixo do hextet inicial após normalização para lowercase. Cobre:
//   - ::1            (loopback)
//   - ::             (unspecified)
//   - fc00::/7       (unique local — fc**, fd**)
//   - fe80::/10      (link-local — fe80..febf, hextets fe8/fe9/fea/feb)
//   - ff00::/8       (multicast)
export function isPrivateIPv6(ip: string): boolean {
  if (!ip) return false;
  const lc = ip.toLowerCase();

  // Loopback / unspecified
  if (lc === '::1' || lc === '::') return true;

  // Strip zone id (e.g. fe80::1%eth0)
  const noZone = lc.split('%')[0];

  // First hextet
  const firstHextet = noZone.split(':')[0] ?? '';
  if (firstHextet.length === 0) return false;

  // fc**/fd** — unique local (fc00::/7)
  if (firstHextet.startsWith('fc') || firstHextet.startsWith('fd')) {
    return true;
  }

  // fe8*/fe9*/fea*/feb* — link-local (fe80::/10)
  if (
    firstHextet.startsWith('fe8') ||
    firstHextet.startsWith('fe9') ||
    firstHextet.startsWith('fea') ||
    firstHextet.startsWith('feb')
  ) {
    return true;
  }

  // ff** — multicast
  if (firstHextet.startsWith('ff')) {
    return true;
  }

  return false;
}

/**
 * DNS rebinding mitigation — resolve o hostname e rejeita se *qualquer* IP
 * retornado for privado/loopback/link-local em produção.
 *
 * Em desenvolvimento (NODE_ENV !== 'production'), aceita IPs privados
 * (V1 simplification A6 — dev/test bypass).
 *
 * Throws Error se host não puder ser resolvido OU contém IP privado em prod.
 */
export async function resolveAndValidateTarget(
  hostname: string,
  isProduction: boolean,
): Promise<{ ip: string; family: 4 | 6 }> {
  let addrs: { address: string; family: number }[] = [];
  try {
    addrs = await dns.lookup(hostname, { all: true, verbatim: true });
  } catch (err) {
    throw new Error(
      `DNS lookup failed for "${hostname}": ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (addrs.length === 0) {
    throw new Error(`DNS returned no addresses for "${hostname}"`);
  }

  // Em dev/test, aceita qualquer IP resolvido (V1 A6 — bypass)
  if (!isProduction) {
    const first = addrs[0];
    return {
      ip: first.address,
      family: first.family === 6 ? 6 : 4,
    };
  }

  // Em produção: TODOS os IPs resolvidos devem ser públicos (anti-rebinding)
  for (const addr of addrs) {
    const isPrivate =
      addr.family === 4
        ? isPrivateIPv4(addr.address)
        : isPrivateIPv6(addr.address);

    if (isPrivate) {
      throw new Error(
        `Hostname "${hostname}" resolves to private/loopback IP "${addr.address}" — refusing to deliver webhook (SSRF / rebinding mitigation)`,
      );
    }
  }

  const first = addrs[0];
  return {
    ip: first.address,
    family: first.family === 6 ? 6 : 4,
  };
}

/**
 * Wrapper helper — chamado pelo use case create-webhook-endpoint e pelo
 * webhook-delivery-worker antes de cada fetch.
 *
 *   1. Parse seguro via `new URL(url)`
 *   2. Em produção: rejeita scheme != 'https:'
 *   3. Em produção: rejeita IP literal privado direto sem DNS lookup
 *   4. Resolve DNS + valida cada IP retornado
 *
 * Throws Error com mensagem específica em caso de violação.
 */
export async function validateWebhookUrlOrThrow(
  url: string,
  options?: { isProduction?: boolean },
): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid URL: "${url}"`);
  }

  const isProduction = options?.isProduction ?? getIsProductionDefault();

  if (isProduction && parsed.protocol !== 'https:') {
    throw new Error(
      `Webhook URL must use https:// in production (got "${parsed.protocol}")`,
    );
  }

  if (!isProduction) {
    // Dev/test bypass — V1 A6: aceita http:// + localhost + 127.0.0.1
    return;
  }

  const hostname = parsed.hostname;

  // Rejeita IP literal privado direto (sem DNS lookup) — fast path
  // hostname pode ser "10.0.0.1" ou "[::1]" no Node URL
  const ipLiteral =
    hostname.startsWith('[') && hostname.endsWith(']')
      ? hostname.slice(1, -1)
      : hostname;

  if (ipLiteral.includes(':')) {
    // IPv6 literal
    if (isPrivateIPv6(ipLiteral)) {
      throw new Error(
        `Webhook URL host "${ipLiteral}" is a private/loopback IPv6 address`,
      );
    }
  } else if (/^\d+\.\d+\.\d+\.\d+$/.test(ipLiteral)) {
    if (isPrivateIPv4(ipLiteral)) {
      throw new Error(
        `Webhook URL host "${ipLiteral}" is a private/loopback IPv4 address`,
      );
    }
  }

  // DNS resolve + validate (rebinding mitigation)
  await resolveAndValidateTarget(hostname, isProduction);
}
