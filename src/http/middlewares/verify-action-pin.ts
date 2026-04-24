import jwt from 'jsonwebtoken';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { getJwtSecret, jwtConfig } from '@/config/jwt';

/**
 * Middleware Fastify que valida um JWT de escopo "action-pin" enviado no
 * header `x-action-pin-token`. Usado para gate de ações sensíveis onde
 * a autenticação JWT padrão não basta (ex.: batch-resolve > 5 aprovações,
 * upload de evidência PDF). Phase 7 / Plan 07-03 (D-09 + D-10).
 *
 * Regras:
 * 1. Header ausente                          → 403 ("PIN verification required")
 * 2. Assinatura inválida ou token malformado → 403 ("Invalid PIN token")
 * 3. `scope` diferente de `action-pin`       → 403 ("PIN scope mismatch")
 * 4. `sub` diferente de `request.user.sub`   → 403 ("PIN user mismatch")
 * 5. `iat` mais antigo que 10min             → 403 ("PIN expired (max 10min)")
 *
 * O JWT é emitido por um fluxo separado (Phase 4 `verify-my-action-pin`) que
 * valida o PIN do usuário e assina um token de curta duração com este
 * escopo. Este middleware NÃO conhece o valor do PIN — apenas verifica a
 * integridade e a idade do token produzido por quem verificou o PIN.
 *
 * IMPORTANT (Info #12 do plan): zero casts `as any` — todos os tipos são
 * explícitos via jwt decoded shape + FastifyRequest.user.sub.
 */
const MAX_PIN_AGE_SECONDS = 10 * 60; // 10 minutos

interface DecodedActionPin {
  scope?: unknown;
  sub?: unknown;
  iat?: unknown;
  exp?: unknown;
}

export async function verifyActionPin(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const rawHeader = request.headers['x-action-pin-token'];
  const token = typeof rawHeader === 'string' ? rawHeader : null;

  if (!token || token.length === 0) {
    reply.status(403).send({ message: 'PIN verification required' });
    return;
  }

  // Resolve o segredo/chave pública no exato mesmo modo do app.ts
  // (HS256 por padrão; RS256 se RSA keys estiverem presentes — usamos
  // a public key para verify).
  const secret = getJwtSecret();
  const verifyKey = typeof secret === 'string' ? secret : secret.public;

  let decoded: DecodedActionPin;
  try {
    const raw = jwt.verify(token, verifyKey, {
      algorithms: [jwtConfig.algorithm],
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    });
    if (typeof raw !== 'object' || raw === null) {
      reply.status(403).send({ message: 'Invalid PIN token' });
      return;
    }
    decoded = raw as DecodedActionPin;
  } catch {
    reply.status(403).send({ message: 'Invalid PIN token' });
    return;
  }

  if (decoded.scope !== 'action-pin') {
    reply.status(403).send({ message: 'PIN scope mismatch' });
    return;
  }

  const userSub = request.user?.sub;
  if (typeof userSub !== 'string' || decoded.sub !== userSub) {
    reply.status(403).send({ message: 'PIN user mismatch' });
    return;
  }

  const iat = typeof decoded.iat === 'number' ? decoded.iat : null;
  const nowSec = Math.floor(Date.now() / 1000);
  if (iat === null || iat < nowSec - MAX_PIN_AGE_SECONDS) {
    reply.status(403).send({ message: 'PIN expired (max 10min)' });
    return;
  }
}
