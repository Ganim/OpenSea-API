/**
 * GenerateAuthenticationOptionsUseCase — Plan 10-07 (D-G1).
 *
 * Generates WebAuthn authentication options (PublicKeyCredentialRequestOptionsJSON)
 * for a specific employee. Persists the challenge in Redis with a 5-minute TTL
 * (one-shot: consumed and deleted by VerifyAuthenticationUseCase).
 *
 * T-10-07-02: Challenge one-shot — DEL after consume in VerifyAuthentication.
 * T-10-07-06: Redis SETEX TTL 300s auto-expire + verifyPunchDeviceToken blocks non-paired callers.
 *
 * Pattern: RESEARCH §"Pattern 6" — @simplewebauthn/server@13.3
 * Auth: verifyPunchDeviceToken (agent caller, not JWT).
 */
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { env } from '@/@env';
import { getRedisClient } from '@/lib/redis';
import type { WebAuthnCredentialsRepository } from '@/repositories/webauthn-credentials.repo';

export interface GenerateAuthenticationOptionsRequest {
  employeeId: string;
}

export class GenerateAuthenticationOptionsUseCase {
  constructor(private readonly webauthnRepo: WebAuthnCredentialsRepository) {}

  async execute(input: GenerateAuthenticationOptionsRequest) {
    const { employeeId } = input;

    // Get existing credentials for this employee to populate allowCredentials
    const credentials = await this.webauthnRepo.findByEmployee(employeeId);

    const options = await generateAuthenticationOptions({
      rpID: env.WEBAUTHN_RP_ID,
      allowCredentials: credentials.map((c) => ({
        id: c.credentialId,
        transports: c.transports as AuthenticatorTransport[],
      })),
      userVerification: 'required',
      timeout: env.WEBAUTHN_REGISTRATION_TIMEOUT_SEC * 1000,
    });

    // Persist challenge in Redis — TTL matches timeout (T-10-07-02)
    const redis = getRedisClient();
    await redis.setex(
      `webauthn:auth:${employeeId}`,
      env.WEBAUTHN_REGISTRATION_TIMEOUT_SEC,
      options.challenge,
    );

    return options;
  }
}
