import { env } from '@/@env';

export const jwtConfig = {
  /** Algoritmo de assinatura (RS256 para assimétrico, HS256 para simétrico) */
  algorithm: (env.JWT_PRIVATE_KEY ? 'RS256' : 'HS256') as 'RS256' | 'HS256',

  /** Tempo de expiração do access token */
  accessTokenExpiresIn: '30m',

  /** Tempo de expiração do refresh token */
  refreshTokenExpiresIn: '7d',

  /** Emissor do token */
  issuer: 'opensea-api',

  /** Audiência do token */
  audience: 'opensea-client',
} as const;

/**
 * Retorna a configuração de secret para o JWT
 * Se houver chaves RSA configuradas, usa RS256 (assimétrico)
 * Caso contrário, usa HS256 (simétrico) com JWT_SECRET
 */
export function getJwtSecret(): string | { private: string; public: string } {
  if (env.JWT_PRIVATE_KEY && env.JWT_PUBLIC_KEY) {
    return {
      private: env.JWT_PRIVATE_KEY,
      public: env.JWT_PUBLIC_KEY,
    };
  }

  return env.JWT_SECRET;
}

/**
 * Verifica se está usando RS256 (chaves assimétricas)
 */
export function isUsingRS256(): boolean {
  return !!(env.JWT_PRIVATE_KEY && env.JWT_PUBLIC_KEY);
}
