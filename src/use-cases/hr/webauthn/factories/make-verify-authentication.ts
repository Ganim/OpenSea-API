/**
 * Factory: VerifyAuthenticationUseCase — Plan 10-07.
 * Wires PrismaWebAuthnCredentialsRepository.
 */
import { PrismaWebAuthnCredentialsRepository } from '@/repositories/prisma/prisma-webauthn-credentials.repo';
import { VerifyAuthenticationUseCase } from '../verify-authentication';

export function makeVerifyAuthenticationUseCase(): VerifyAuthenticationUseCase {
  const webauthnRepo = new PrismaWebAuthnCredentialsRepository();
  return new VerifyAuthenticationUseCase(webauthnRepo);
}
