/**
 * Wave 0 spec stub — Phase 11 / Plan 11-02 will implement
 * `src/modules/system/webhooks/lib/classify-http-response.ts`.
 * Tabela de classificação verbatim de D-27.
 */
import { describe, expect, it } from 'vitest';

describe('classify-http-response — HTTP status disposition (D-27, Plan 11-02 target)', () => {
  it('2xx → DELIVERED (sucesso, sem retry)', () => {
    expect(
      true,
      'Plan 11-02 must classify 2xx as { disposition: "DELIVERED", retry: false }',
    ).toBe(false);
  });

  it('3xx redirect → REDIRECT_BLOCKED (no retry, anti-SSRF)', () => {
    expect(
      true,
      'Plan 11-02 must classify 3xx as REDIRECT_BLOCKED (no follow, no retry); SSRF prevention',
    ).toBe(false);
  });

  it('408 Request Timeout → retry', () => {
    expect(
      true,
      'Plan 11-02 must classify 408 as { disposition: "FAILED", retry: true, errorClass: "TIMEOUT" }',
    ).toBe(false);
  });

  it('410 Gone → AUTO_DISABLED imediato (D-25)', () => {
    expect(
      true,
      'Plan 11-02 must classify 410 as { disposition: "AUTO_DISABLE", reason: "HTTP_410_GONE" } per RFC 9110',
    ).toBe(false);
  });

  it('429 Too Many Requests → retry com Retry-After honrado (cap 1h, D-28)', () => {
    expect(
      true,
      'Plan 11-02 must parse Retry-After (seconds or HTTP-date), cap 1 hour, and schedule next attempt',
    ).toBe(false);
  });

  it('5xx → retry', () => {
    expect(
      true,
      'Plan 11-02 must classify 5xx as { retry: true, errorClass: "HTTP_5XX" } using the standard backoff schedule',
    ).toBe(false);
  });

  it('4xx (não 408/410/429) → FAILED, sem retry', () => {
    expect(
      true,
      'Plan 11-02 must classify 4xx (excluding 408, 410, 429) as { retry: false, errorClass: "HTTP_4XX" }',
    ).toBe(false);
  });
});
