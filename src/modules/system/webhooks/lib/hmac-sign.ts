/**
 * Webhook HMAC signing helpers — Phase 11 / Plan 11-02 / D-04, D-05, D-08.
 *
 * Stripe-style signature header:
 *   `t=<unix_seconds>,v1=<hex_64>` — onde v1 = HMAC-SHA256(secret, `${t}.${rawBody}`)
 *
 * Cliente externo verifica recomputando o HMAC com seu secret armazenado
 * localmente. Anti-replay: cliente DEVE rejeitar `Math.abs(now - t) > 300s`
 * (5min skew — documentado em Plan 11-03 inline doc para o cliente).
 *
 * Secret format: `whsec_<base64url(32 random bytes)>` — total ~44 chars
 * incluindo prefixo. Prefixo `whsec_` permite scanners (GitHub, GitGuardian)
 * detectarem secret leaks em código público.
 */
import { createHmac, randomBytes } from 'node:crypto';

export interface SignedWebhookPayload {
  /** Header pronto para o request: `t=<unix>,v1=<hex>` */
  signatureHeader: string;
  /** Unix timestamp em segundos usado na assinatura */
  timestamp: number;
  /** Hex digest puro (64 chars) — exposto para testes */
  signature: string;
}

/**
 * Computa a signature HMAC-SHA256 do payload e retorna o header pronto.
 *
 * @param rawBody  — bytes EXATOS que serão enviados no request body. O HMAC
 *                   é calculado sobre `${t}.${rawBody}` — NÃO sobre o body
 *                   puro (Stripe convention; previne re-uso de signature
 *                   com timestamps diferentes).
 * @param secret   — secret armazenado no endpoint (`whsec_<base64url>`).
 * @param now      — opcional; default = `new Date()`. Aceita Date para tornar
 *                   testes determinísticos.
 */
export function signWebhookPayload(
  rawBody: string,
  secret: string,
  now: Date = new Date(),
): SignedWebhookPayload {
  if (typeof rawBody !== 'string') {
    throw new TypeError('rawBody must be a string');
  }
  if (typeof secret !== 'string' || secret.length === 0) {
    throw new TypeError('secret must be a non-empty string');
  }

  const t = Math.floor(now.getTime() / 1000);
  const signature = createHmac('sha256', secret)
    .update(`${t}.${rawBody}`)
    .digest('hex');

  return {
    signatureHeader: `t=${t},v1=${signature}`,
    timestamp: t,
    signature,
  };
}

/**
 * Gera um novo secret 32 bytes random encoded como base64url + prefixado
 * `whsec_`. Total length ~44 chars (`whsec_` + 43 base64url chars sem
 * padding `=`).
 */
export function generateWebhookSecret(): string {
  return `whsec_${randomBytes(32).toString('base64url')}`;
}

/**
 * Extrai os últimos 4 caracteres do secret para o DTO mascarado (D-08).
 * Usado pelo mapper webhook-endpoint-to-dto para construir
 * `secretMasked = whsec_••••••••<last4>`.
 */
export function getSecretLast4(secret: string): string {
  if (typeof secret !== 'string' || secret.length < 4) return '';
  return secret.slice(-4);
}
