/**
 * Factory: GenerateAuthenticationOptionsUseCase — Plan 10-07.
 * Wires PrismaWebAuthnCredentialsRepository.
 */
import { PrismaWebAuthnCredentialsRepository } from '@/repositories/prisma/prisma-webauthn-credentials.repo';
import { GenerateAuthenticationOptionsUseCase } from '../generate-authentication-options';

export function makeGenerateAuthenticationOptionsUseCase(): GenerateAuthenticationOptionsUseCase {
  const webauthnRepo = new PrismaWebAuthnCredentialsRepository();
  return new GenerateAuthenticationOptionsUseCase(webauthnRepo);
}
