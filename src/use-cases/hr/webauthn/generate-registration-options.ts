/**
 * GenerateRegistrationOptionsUseCase — Plan 10-07 (D-G1).
 *
 * Generates WebAuthn registration options (PublicKeyCredentialCreationOptionsJSON)
 * for a specific employee. Persists the challenge in Redis with a 5-minute TTL
 * (one-shot: consumed and deleted by VerifyRegistrationUseCase).
 *
 * Pattern: RESEARCH §"Pattern 6" — @simplewebauthn/server@13.3
 * Auth: verifyPunchDeviceToken (agent caller).
 * LGPD: excludeCredentials uses credentialId (non-PII) only.
 */
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { env } from '@/@env';
import { getRedisClient } from '@/lib/redis';
import type { WebAuthnCredentialsRepository } from '@/repositories/webauthn-credentials.repo';

export interface GenerateRegistrationOptionsRequest {
  tenantId: string;
  employeeId: string;
  employeeName: string;
}

export class GenerateRegistrationOptionsUseCase {
  constructor(private readonly webauthnRepo: WebAuthnCredentialsRepository) {}

  async execute(input: GenerateRegistrationOptionsRequest) {
    const { tenantId, employeeId, employeeName } = input;

    if (!tenantId || !employeeId) {
      throw new ResourceNotFoundError('Employee not found');
    }

    // Retrieve existing credentials to populate excludeCredentials
    const existing = await this.webauthnRepo.findByEmployee(employeeId);

    const options = await generateRegistrationOptions({
      rpName: env.WEBAUTHN_RP_ID === 'localhost' ? 'OpenSea Dev' : 'OpenSea',
      rpID: env.WEBAUTHN_RP_ID,
      // userID must be a Uint8Array — encode employeeId as UTF-8 bytes
      userID: new TextEncoder().encode(employeeId),
      userName: employeeName,
      attestationType: 'none',
      excludeCredentials: existing.map((c) => ({
        id: c.credentialId,
        transports: c.transports as AuthenticatorTransport[],
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'required',
        authenticatorAttachment: 'platform',
      },
      timeout: env.WEBAUTHN_REGISTRATION_TIMEOUT_SEC * 1000,
    });

    // Persist challenge in Redis — TTL matches timeout
    const redis = getRedisClient();
    await redis.setex(
      `webauthn:reg:${employeeId}`,
      env.WEBAUTHN_REGISTRATION_TIMEOUT_SEC,
      options.challenge,
    );

    return options;
  }
}
