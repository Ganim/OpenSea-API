/**
 * HMAC-SHA256 utility para o `nsrHash` público de recibos de ponto
 * (Phase 06 / Plan 06-03).
 *
 * Por que HMAC (e não simples `sha256(tenantId || nsrNumber)`)?
 * Concat-SHA256 é determinístico e pública — qualquer adversário que conheça
 * o tenantId e consiga adivinhar NSRs sequenciais (1, 2, 3, …) pode enumerar
 * todos os recibos sem autenticação. HMAC exige uma chave secreta
 * (`RECEIPT_HMAC_KEY`) que só vive no servidor; sem a chave, o espaço de
 * busca vira 2^256.
 *
 * Chave:
 *   - Produção: `env.RECEIPT_HMAC_KEY` obrigatória (validação acontece em
 *     `src/@env/index.ts` — boot falha se ausente / curta / não-base64).
 *   - Dev/test: fallback literal (loud `console.warn` no primeiro uso).
 *     Isto permite `npm run dev` sem configurar a chave mas torna recibos
 *     dev inválidos em produção (HMAC diferente).
 *
 * Output:
 *   String hex 64 chars (equivalente a 32 bytes de HMAC-SHA256 encodados em
 *   lower-case hex). Fica @unique na coluna `time_entries.receipt_verify_hash`
 *   (VARCHAR(64)) — colisão é criptograficamente improvável.
 */

import { createHmac } from 'node:crypto';

import { env } from '@/@env';

/**
 * Fallback determinístico — SOMENTE em dev/test. Documentado no schema
 * Zod de `RECEIPT_HMAC_KEY`. Qualquer recibo gerado com este fallback NÃO
 * é verificável contra um ambiente de produção que usa a chave real.
 */
const DEV_FALLBACK_KEY =
  'dev-only-not-for-production-receipt-hmac-key-fallback';

let warned = false;

function getHmacKey(): string {
  if (env.RECEIPT_HMAC_KEY) return env.RECEIPT_HMAC_KEY;

  if (env.NODE_ENV === 'production') {
    throw new Error(
      'RECEIPT_HMAC_KEY é obrigatória em produção. ' +
        'Gere com `openssl rand -base64 32` e exporte como env var.',
    );
  }

  if (!warned) {
    // Loud warning — desenvolvedor precisa saber que está usando fallback.
    // Subsequentes chamadas não repetem para não poluir logs de teste.
    // eslint-disable-next-line no-console
    console.warn(
      '[nsr-hash] RECEIPT_HMAC_KEY ausente — usando DEV_FALLBACK_KEY. ' +
        'Recibos gerados NÃO serão verificáveis em produção.',
    );
    warned = true;
  }
  return DEV_FALLBACK_KEY;
}

/**
 * Computa o hash público do recibo de uma batida. Determinístico: mesmo input
 * → mesmo output. Diferença de tenant → hash distinto mesmo com NSR igual.
 *
 * @param tenantId   UUID do tenant (não pode ser vazio).
 * @param nsrNumber  Inteiro positivo (NSR sequencial Portaria 671).
 * @returns          Hex lowercase 64 chars.
 */
export function computeReceiptNsrHash(
  tenantId: string,
  nsrNumber: number,
): string {
  if (!tenantId) {
    throw new Error('computeReceiptNsrHash: tenantId obrigatório');
  }
  if (!Number.isInteger(nsrNumber) || nsrNumber <= 0) {
    throw new Error(
      `computeReceiptNsrHash: nsrNumber deve ser inteiro positivo (recebido=${nsrNumber})`,
    );
  }

  return createHmac('sha256', getHmacKey())
    .update(`${tenantId}:${nsrNumber}`)
    .digest('hex');
}

/**
 * Testa se uma string tem o formato esperado de `nsrHash` (64 chars hex
 * lowercase). Usado como defense-in-depth antes de consultar o banco.
 */
export function isValidNsrHashFormat(hash: string): boolean {
  return /^[a-f0-9]{64}$/.test(hash);
}
