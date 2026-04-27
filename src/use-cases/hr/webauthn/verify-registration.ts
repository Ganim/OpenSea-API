/**
 * VerifyRegistrationUseCase — Plan 10-07 (D-G1).
 *
 * Verifies the WebAuthn registration response (attestation) from the Electron agent:
 *   1. Consumes (DEL) the one-shot challenge from Redis.
 *   2. Calls @simplewebauthn/server verifyRegistrationResponse.
 *   3. Creates WebAuthnCredential row in DB.
 *   4. Emits BIO_ENROLLED audit log (LGPD: credentialId base64url only, never publicKey).
 *
 * T-10-07-02: Challenge one-shot (DEL after consume) prevents replay.
 * T-10-07-03: Audit logs credentialId + deviceType + backedUp — NOT publicKey.
 */
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { env } from '@/@env';
import { AuditAction } from '@/entities/audit/audit-action.enum';
import { AuditEntity } from '@/entities/audit/audit-entity.enum';
import { getRedisClient } from '@/lib/redis';
import type { WebAuthnCredentialsRepository } from '@/repositories/webauthn-credentials.repo';

export interface VerifyRegistrationAuditRepository {
  log(entry: {
    tenantId: string;
    action: string;
    entity: string;
    entityId: string;
    module: string;
    newData: Record<string, unknown>;
  }): Promise<{ id: string }>;
}

export interface VerifyRegistrationRequest {
  tenantId: string;
  employeeId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  response: any;
}

export interface VerifyRegistrationResponse {
  verified: true;
  credentialId: string;
}

export class VerifyRegistrationUseCase {
  constructor(
    private readonly webauthnRepo: WebAuthnCredentialsRepository,
    private readonly auditLogsRepo: VerifyRegistrationAuditRepository,
  ) {}

  async execute(
    input: VerifyRegistrationRequest,
  ): Promise<VerifyRegistrationResponse> {
    const redis = getRedisClient();
    const challenge = await redis.get(`webauthn:reg:${input.employeeId}`);

    if (!challenge) {
      throw new BadRequestError('No active challenge or challenge expired');
    }

    // One-shot: consume challenge immediately (T-10-07-02)
    await redis.del(`webauthn:reg:${input.employeeId}`);

    const { verified, registrationInfo } = await verifyRegistrationResponse({
      response: input.response,
      expectedChallenge: challenge,
      expectedOrigin: env.WEBAUTHN_ORIGIN,
      expectedRPID: env.WEBAUTHN_RP_ID,
    });

    if (!verified || !registrationInfo) {
      throw new BadRequestError('Registration verification failed');
    }

    const cred = await this.webauthnRepo.create({
      tenantId: input.tenantId,
      employeeId: input.employeeId,
      credentialId: Buffer.from(registrationInfo.credential.id, 'base64url'),
      publicKey: Buffer.from(registrationInfo.credential.publicKey),
      counter: BigInt(registrationInfo.credential.counter),
      transports: registrationInfo.credential.transports ?? [],
      deviceType: registrationInfo.credentialDeviceType,
      backedUp: registrationInfo.credentialBackedUp,
    });

    // Audit log — LGPD: no publicKey in audit data (T-10-07-03)
    await this.auditLogsRepo.log({
      tenantId: input.tenantId,
      action: AuditAction.BIO_ENROLLED,
      entity: AuditEntity.PUNCH_BIO_AGENT,
      entityId: cred.id,
      module: 'HR',
      newData: {
        credentialId: cred.credentialId.toString('base64url'),
        deviceType: cred.deviceType,
        backedUp: cred.backedUp,
        employeeId: input.employeeId,
      },
    });

    return {
      verified: true,
      credentialId: cred.credentialId.toString('base64url'),
    };
  }
}
