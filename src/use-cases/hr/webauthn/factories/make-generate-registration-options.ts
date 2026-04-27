/**
 * Factory: GenerateRegistrationOptionsUseCase — Plan 10-07.
 * Wires PrismaWebAuthnCredentialsRepository.
 */
import { PrismaWebAuthnCredentialsRepository } from '@/repositories/prisma/prisma-webauthn-credentials.repo';
import { GenerateRegistrationOptionsUseCase } from '../generate-registration-options';

export function makeGenerateRegistrationOptionsUseCase(): GenerateRegistrationOptionsUseCase {
  const webauthnRepo = new PrismaWebAuthnCredentialsRepository();
  return new GenerateRegistrationOptionsUseCase(webauthnRepo);
}
