/**
 * HTTP response classifier — Phase 11 / Plan 11-02 / D-27, D-28.
 *
 * Mapeia status code → disposition (DELIVERED/RETRY/FAILED/AUTO_DISABLE/RETRY_AFTER).
 * O worker consome esse mapping para decidir entre throw (BullMQ retry),
 * `job.moveToDelayed + DelayedError` (honra Retry-After), ou persist+return.
 *
 * D-27 verbatim:
 *   - 2xx        → DELIVERED  (sucesso, sem retry)
 *   - 3xx        → FAILED     (REDIRECT_BLOCKED, no retry — anti-SSRF)
 *   - 408        → RETRY      (TIMEOUT)
 *   - 410        → AUTO_DISABLE (HTTP_410_GONE — RFC 9110 endpoint deleted)
 *   - 429        → RETRY_AFTER (parse Retry-After, cap 1h via D-28)
 *   - 4xx outros → FAILED     (HTTP_4XX, no retry — config bug)
 *   - 5xx        → RETRY      (HTTP_5XX, custom backoff)
 */
import type { WebhookErrorClass } from '@prisma/generated/client';

export type ClassificationOutcome =
  | 'DELIVERED'
  | 'RETRY'
  | 'FAILED'
  | 'AUTO_DISABLE'
  | 'RETRY_AFTER';

export interface HttpResponseLike {
  status: number;
  headers: { get(name: string): string | null } | Headers;
}

export interface ClassificationResult {
  outcome: ClassificationOutcome;
  errorClass?: WebhookErrorClass;
  /** Para 429: ms a esperar antes do próximo attempt (já cap em 1h) */
  retryAfterMs?: number;
  /** Para AUTO_DISABLE: motivo a persistir em endpoint.autoDisabledReason */
  autoDisableReason?: 'HTTP_410_GONE';
}

/** Cap de Retry-After: 1h. Configurável via const para tests. */
export const RETRY_AFTER_CAP_MS = 60 * 60 * 1000;

/**
 * Parse Retry-After header per RFC 9110:
 *   - Inteiro N (segundos) → N * 1000 ms
 *   - HTTP-date (RFC 7231) → ms até essa data
 *   - Inválido / null     → null
 *
 * Resultado é capeado em `RETRY_AFTER_CAP_MS` (D-28).
 */
export function parseRetryAfter(raw: string | null): number | null {
  if (!raw) return null;

  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;

  // Try inteiro segundos primeiro
  const asInt = Number.parseInt(trimmed, 10);
  if (Number.isInteger(asInt) && asInt >= 0 && String(asInt) === trimmed) {
    const ms = asInt * 1000;
    return Math.min(ms, RETRY_AFTER_CAP_MS);
  }

  // HTTP-date fallback
  const dateMs = Date.parse(trimmed);
  if (Number.isNaN(dateMs)) return null;

  const delta = dateMs - Date.now();
  if (delta <= 0) return 0;
  return Math.min(delta, RETRY_AFTER_CAP_MS);
}

function getHeader(
  headers: HttpResponseLike['headers'],
  name: string,
): string | null {
  if (typeof (headers as Headers).get === 'function') {
    return (headers as Headers).get(name);
  }
  return null;
}

export function classifyHttpResponse(
  response: HttpResponseLike,
): ClassificationResult {
  const status = response.status;

  // 2xx — sucesso
  if (status >= 200 && status < 300) {
    return { outcome: 'DELIVERED' };
  }

  // 3xx — redirect bloqueado (D-27, anti-SSRF)
  if (status >= 300 && status < 400) {
    return {
      outcome: 'FAILED',
      errorClass: 'REDIRECT_BLOCKED' as WebhookErrorClass,
    };
  }

  // 408 Request Timeout — retry
  if (status === 408) {
    return {
      outcome: 'RETRY',
      errorClass: 'TIMEOUT' as WebhookErrorClass,
    };
  }

  // 410 Gone — AUTO_DISABLE imediato (D-25)
  if (status === 410) {
    return {
      outcome: 'AUTO_DISABLE',
      errorClass: 'HTTP_4XX' as WebhookErrorClass,
      autoDisableReason: 'HTTP_410_GONE',
    };
  }

  // 429 Too Many Requests — Retry-After (D-28)
  if (status === 429) {
    const retryAfterRaw = getHeader(response.headers, 'retry-after');
    const retryAfterMs = parseRetryAfter(retryAfterRaw);
    return {
      outcome: 'RETRY_AFTER',
      errorClass: 'HTTP_4XX' as WebhookErrorClass,
      retryAfterMs: retryAfterMs ?? undefined,
    };
  }

  // Outros 4xx — FAILED (config bug do customer, no retry)
  if (status >= 400 && status < 500) {
    return {
      outcome: 'FAILED',
      errorClass: 'HTTP_4XX' as WebhookErrorClass,
    };
  }

  // 5xx — RETRY com custom backoff
  if (status >= 500 && status < 600) {
    return {
      outcome: 'RETRY',
      errorClass: 'HTTP_5XX' as WebhookErrorClass,
    };
  }

  // Status code fora do range válido (ex.: 0 de network error já tratado externamente).
  // Tratamos defensivamente como FAILED.
  return {
    outcome: 'FAILED',
    errorClass: 'HTTP_4XX' as WebhookErrorClass,
  };
}

/**
 * Classifica um erro de network/DNS/TLS/timeout (capturado via try/catch
 * sobre fetch). Retorna RETRY com errorClass apropriada.
 *
 * Heurística textual sobre err.message — Node fetch não expõe códigos
 * estruturados consistentemente.
 */
export function classifyNetworkError(err: unknown): ClassificationResult {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err);

  if (
    msg.includes('timed out') ||
    msg.includes('timeout') ||
    msg.includes('aborterror')
  ) {
    return { outcome: 'RETRY', errorClass: 'TIMEOUT' as WebhookErrorClass };
  }
  if (
    msg.includes('enotfound') ||
    msg.includes('eai_again') ||
    msg.includes('dns')
  ) {
    return { outcome: 'RETRY', errorClass: 'DNS_FAIL' as WebhookErrorClass };
  }
  if (
    msg.includes('certificate') ||
    msg.includes('cert ') ||
    msg.includes('tls') ||
    msg.includes('ssl') ||
    msg.includes('self signed') ||
    msg.includes('self-signed')
  ) {
    return { outcome: 'RETRY', errorClass: 'TLS' as WebhookErrorClass };
  }

  return { outcome: 'RETRY', errorClass: 'NETWORK' as WebhookErrorClass };
}
