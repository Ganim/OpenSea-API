import { createHmac, randomBytes } from 'node:crypto';

/**
 * Código rotativo estilo TOTP.
 *
 * Este módulo é a base compartilhada por todos os fluxos de código
 * rotativo do projeto: pareamento de dispositivos de ponto, pareamento
 * de print-agents, token administrativo de reset de senha, etc.
 *
 * O código é derivado de `HMAC-SHA256(secret, bucket)`, onde `bucket` é
 * `floor(agora / bucketSeconds)`. Cada byte do hash é mapeado para um
 * caractere do CHARSET usando os 5 bits menos significativos.
 *
 * Validação aceita o bucket atual e N buckets anteriores (tolerance),
 * permitindo um drift efetivo de `(tolerance + 1) * bucketSeconds`.
 */

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 chars (5 bits)

export interface RotatingCodeConfig {
  /** Janela de rotação em segundos. Default: 60 */
  bucketSeconds?: number;
  /** Número de caracteres do código. Default: 6 */
  codeLength?: number;
  /** Quantos buckets anteriores aceitar na validação. Default: 1 */
  tolerance?: number;
}

const DEFAULT_BUCKET_SECONDS = 60;
const DEFAULT_CODE_LENGTH = 6;
const DEFAULT_TOLERANCE = 1;

function resolveConfig(config?: RotatingCodeConfig) {
  return {
    bucketSeconds: config?.bucketSeconds ?? DEFAULT_BUCKET_SECONDS,
    codeLength: config?.codeLength ?? DEFAULT_CODE_LENGTH,
    tolerance: config?.tolerance ?? DEFAULT_TOLERANCE,
  };
}

export function getCurrentBucket(
  now: Date = new Date(),
  bucketSeconds = DEFAULT_BUCKET_SECONDS,
): number {
  return Math.floor(now.getTime() / 1000 / bucketSeconds);
}

export function getBucketExpiresAt(
  bucket: number,
  bucketSeconds = DEFAULT_BUCKET_SECONDS,
): Date {
  return new Date((bucket + 1) * bucketSeconds * 1000);
}

export function generateRotatingCode(
  secret: string,
  bucket: number,
  config?: RotatingCodeConfig,
): string {
  const { codeLength } = resolveConfig(config);
  const hash = createHmac('sha256', secret).update(String(bucket)).digest();
  let code = '';
  for (let i = 0; i < codeLength; i++) {
    code += CHARSET[hash[i] & 0x1f];
  }
  return code;
}

export interface CurrentRotatingCode {
  code: string;
  expiresAt: Date;
  periodSeconds: number;
}

export function getCurrentRotatingCode(
  secret: string,
  now: Date = new Date(),
  config?: RotatingCodeConfig,
): CurrentRotatingCode {
  const { bucketSeconds } = resolveConfig(config);
  const bucket = getCurrentBucket(now, bucketSeconds);
  return {
    code: generateRotatingCode(secret, bucket, config),
    expiresAt: getBucketExpiresAt(bucket, bucketSeconds),
    periodSeconds: bucketSeconds,
  };
}

export function isValidRotatingCode(
  secret: string,
  code: string,
  now: Date = new Date(),
  config?: RotatingCodeConfig,
): boolean {
  const { bucketSeconds, tolerance } = resolveConfig(config);
  const currentBucket = getCurrentBucket(now, bucketSeconds);
  for (let offset = 0; offset <= tolerance; offset++) {
    if (generateRotatingCode(secret, currentBucket - offset, config) === code) {
      return true;
    }
  }
  return false;
}

/**
 * Gera um secret aleatório adequado para rotating codes.
 * 32 bytes em hex = 64 chars; cabe em VARCHAR(64).
 */
export function generateRotatingSecret(): string {
  return randomBytes(32).toString('hex');
}
