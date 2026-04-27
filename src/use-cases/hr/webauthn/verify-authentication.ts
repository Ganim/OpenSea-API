/**
 * VerifyAuthenticationUseCase — Plan 10-07 (D-G1).
 *
 * Verifies a WebAuthn authentication response (assertion) from the Electron agent:
 *   1. Looks up stored credential by credentialId from the assertion.
 *   2. Retrieves one-shot challenge from Redis (DEL after consume).
 *   3. Calls @simplewebauthn/server verifyAuthenticationResponse.
 *   4. CRITICAL — Counter regression check: if newCounter <= storedCounter, REJECT
 *      (possible replay attack / cloned credential — T-10-07-01).
 *   5. Updates stored counter and lastUsedAt on success.
 *
 * T-10-07-01: Counter regression sentinel — explicit check + @simplewebauthn/server
 *             built-in counter check (double defense against RESEARCH §STRIDE T-10-06).
 * T-10-07-02: Challenge one-shot — DEL after consume.
 *
 * Pattern: RESEARCH §"Pattern 6" — @simplewebauthn/server@13.3
 * Auth: verifyPunchDeviceToken (agent caller, not JWT).
 */
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { env } from '@/@env';
import { getRedisClient } from '@/lib/redis';
import type { WebAuthnCredentialsRepository } from '@/repositories/webauthn-credentials.repo';

export interface VerifyAuthenticationRequest {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  response: any;
}

export interface VerifyAuthenticationResult {
  verified: true;
  employeeId: string;
  tenantId: string;
}

export class VerifyAuthenticationUseCase {
  constructor(private readonly webauthnRepo: WebAuthnCredentialsRepository) {}

  async execute(
    input: VerifyAuthenticationRequest,
  ): Promise<VerifyAuthenticationResult> {
    const credentialIdBase64: string = input.response.id;

    // Look up stored credential by credentialId (base64url-encoded from assertion)
    const stored =
      await this.webauthnRepo.findByCredentialIdBase64(credentialIdBase64);

    if (!stored) {
      throw new ResourceNotFoundError('Credential not found');
    }

    const redis = getRedisClient();
    const challenge = await redis.get(`webauthn:auth:${stored.employeeId}`);

    if (!challenge) {
      throw new BadRequestError('No active challenge or challenge expired');
    }

    // One-shot: consume challenge immediately (T-10-07-02)
    await redis.del(`webauthn:auth:${stored.employeeId}`);

    const { verified, authenticationInfo } = await verifyAuthenticationResponse(
      {
        response: input.response,
        expectedChallenge: challenge,
        expectedOrigin: env.WEBAUTHN_ORIGIN,
        expectedRPID: env.WEBAUTHN_RP_ID,
        credential: {
          id: stored.credentialId.toString('base64url'),
          publicKey: stored.publicKey,
          counter: Number(stored.counter),
          transports: stored.transports as AuthenticatorTransport[],
        },
        requireUserVerification: true,
      },
    );

    if (!verified) {
      throw new BadRequestError('Authentication verification failed');
    }

    // Counter regression check (T-10-07-01):
    // @simplewebauthn/server v13 already rejects counter <= stored counter;
    // we add an explicit sentinel as double-defense (RESEARCH §STRIDE T-10-06).
    if (Number(authenticationInfo.newCounter) <= Number(stored.counter)) {
      throw new BadRequestError(
        'Counter regression detected — possible replay or cloned credential',
      );
    }

    // Update stored counter and lastUsedAt
    await this.webauthnRepo.updateCounter(
      stored.id,
      BigInt(authenticationInfo.newCounter),
    );
    await this.webauthnRepo.updateLastUsedAt(stored.id, new Date());

    return {
      verified: true,
      employeeId: stored.employeeId,
      tenantId: stored.tenantId,
    };
  }
}
