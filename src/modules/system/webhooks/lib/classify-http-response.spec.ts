/**
 * Phase 11 / Plan 11-02 — classify-http-response spec.
 *
 * Tabela D-27 verbatim:
 *   - 2xx → DELIVERED
 *   - 3xx → FAILED + REDIRECT_BLOCKED
 *   - 408 → RETRY + TIMEOUT
 *   - 410 → AUTO_DISABLE + HTTP_410_GONE
 *   - 429 → RETRY_AFTER (cap 1h via D-28)
 *   - 4xx outros → FAILED + HTTP_4XX
 *   - 5xx → RETRY + HTTP_5XX
 */
import { describe, expect, it } from 'vitest';

import {
  classifyHttpResponse,
  parseRetryAfter,
  RETRY_AFTER_CAP_MS,
} from './classify-http-response';

function mockResponse(status: number, headers: Record<string, string> = {}) {
  const h = new Headers();
  for (const [k, v] of Object.entries(headers)) h.set(k, v);
  return { status, headers: h };
}

describe('classify-http-response — HTTP status disposition (D-27)', () => {
  it('2xx → DELIVERED (sucesso, sem retry)', () => {
    expect(classifyHttpResponse(mockResponse(200))).toEqual({
      outcome: 'DELIVERED',
    });
    expect(classifyHttpResponse(mockResponse(204))).toEqual({
      outcome: 'DELIVERED',
    });
  });

  it('3xx redirect → REDIRECT_BLOCKED (no retry, anti-SSRF)', () => {
    const r = classifyHttpResponse(mockResponse(301));
    expect(r.outcome).toBe('FAILED');
    expect(r.errorClass).toBe('REDIRECT_BLOCKED');

    const r2 = classifyHttpResponse(mockResponse(302));
    expect(r2.outcome).toBe('FAILED');
    expect(r2.errorClass).toBe('REDIRECT_BLOCKED');
  });

  it('408 Request Timeout → retry', () => {
    const r = classifyHttpResponse(mockResponse(408));
    expect(r.outcome).toBe('RETRY');
    expect(r.errorClass).toBe('TIMEOUT');
  });

  it('410 Gone → AUTO_DISABLED imediato (D-25)', () => {
    const r = classifyHttpResponse(mockResponse(410));
    expect(r.outcome).toBe('AUTO_DISABLE');
    expect(r.autoDisableReason).toBe('HTTP_410_GONE');
  });

  it('429 Too Many Requests → retry com Retry-After honrado (cap 1h, D-28)', () => {
    // segundos
    const r1 = classifyHttpResponse(mockResponse(429, { 'retry-after': '30' }));
    expect(r1.outcome).toBe('RETRY_AFTER');
    expect(r1.retryAfterMs).toBe(30_000);

    // cap em 1h
    const r2 = classifyHttpResponse(
      mockResponse(429, { 'retry-after': '99999' }),
    );
    expect(r2.retryAfterMs).toBe(RETRY_AFTER_CAP_MS);

    // HTTP-date
    const future = new Date(Date.now() + 5 * 60 * 1000);
    const r3 = classifyHttpResponse(
      mockResponse(429, { 'retry-after': future.toUTCString() }),
    );
    expect(r3.outcome).toBe('RETRY_AFTER');
    expect(r3.retryAfterMs).toBeGreaterThan(0);
    expect(r3.retryAfterMs!).toBeLessThanOrEqual(RETRY_AFTER_CAP_MS);

    // sem header
    const r4 = classifyHttpResponse(mockResponse(429));
    expect(r4.outcome).toBe('RETRY_AFTER');
    expect(r4.retryAfterMs).toBeUndefined();
  });

  it('5xx → retry', () => {
    const r1 = classifyHttpResponse(mockResponse(500));
    expect(r1.outcome).toBe('RETRY');
    expect(r1.errorClass).toBe('HTTP_5XX');

    const r2 = classifyHttpResponse(mockResponse(503));
    expect(r2.outcome).toBe('RETRY');
    expect(r2.errorClass).toBe('HTTP_5XX');
  });

  it('4xx (não 408/410/429) → FAILED, sem retry', () => {
    expect(classifyHttpResponse(mockResponse(400)).outcome).toBe('FAILED');
    expect(classifyHttpResponse(mockResponse(401)).outcome).toBe('FAILED');
    expect(classifyHttpResponse(mockResponse(403)).outcome).toBe('FAILED');
    expect(classifyHttpResponse(mockResponse(404)).outcome).toBe('FAILED');
    expect(classifyHttpResponse(mockResponse(422)).errorClass).toBe('HTTP_4XX');
  });

  it('parseRetryAfter retorna null para input vazio/inválido', () => {
    expect(parseRetryAfter(null)).toBeNull();
    expect(parseRetryAfter('')).toBeNull();
    expect(parseRetryAfter('garbage value')).toBeNull();
  });
});
