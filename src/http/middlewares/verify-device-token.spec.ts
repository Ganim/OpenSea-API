import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';

import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryPosDevicePairingsRepository } from '@/repositories/sales/in-memory/in-memory-pos-device-pairings-repository';
import { makePosDevicePairing } from '@/utils/tests/factories/sales/make-pos-device-pairing';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { makeVerifyDeviceToken } from './verify-device-token';

function buildRequest(
  authorization?: string,
): FastifyRequest & { device?: unknown } {
  const headers: Record<string, string> = {};
  if (authorization !== undefined) headers.authorization = authorization;
  return { headers } as unknown as FastifyRequest & { device?: unknown };
}

describe('verifyDeviceToken', () => {
  let pairingsRepository: InMemoryPosDevicePairingsRepository;
  let verifyDeviceToken: (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => Promise<void>;

  beforeEach(() => {
    pairingsRepository = new InMemoryPosDevicePairingsRepository();
    verifyDeviceToken = makeVerifyDeviceToken(pairingsRepository);
  });

  it('attaches request.device when token is valid and pairing is active', async () => {
    const token = 'raw-token-abc123';
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const tenantId = new UniqueEntityID();
    const terminalId = new UniqueEntityID();
    const pairingId = new UniqueEntityID();

    const pairing = makePosDevicePairing(
      {
        id: pairingId.toString(),
        tenantId,
        terminalId,
        deviceTokenHash: tokenHash,
      },
      pairingId,
    );
    pairingsRepository.items.push(pairing);

    const request = buildRequest(`Bearer ${token}`);

    await verifyDeviceToken(request, {} as FastifyReply);

    expect((request as { device?: unknown }).device).toEqual({
      terminalId: terminalId.toString(),
      tenantId: tenantId.toString(),
      deviceId: pairingId.toString(),
    });
  });

  it('throws UnauthorizedError when Authorization header is missing', async () => {
    const request = buildRequest();
    await expect(
      verifyDeviceToken(request, {} as FastifyReply),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('throws UnauthorizedError when header lacks Bearer prefix', async () => {
    const request = buildRequest('xyz-no-bearer-prefix');
    await expect(
      verifyDeviceToken(request, {} as FastifyReply),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('throws UnauthorizedError when pairing does not exist for the token', async () => {
    const request = buildRequest('Bearer unmatched-token');
    await expect(
      verifyDeviceToken(request, {} as FastifyReply),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('throws UnauthorizedError when pairing exists but was revoked (isActive=false)', async () => {
    const token = 'raw-token-revoked';
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const revokedPairing = makePosDevicePairing({
      deviceTokenHash: tokenHash,
      isActive: false,
      revokedByUserId: 'admin-1',
      revokedReason: 'compromised',
    });
    pairingsRepository.items.push(revokedPairing);

    const request = buildRequest(`Bearer ${token}`);
    await expect(
      verifyDeviceToken(request, {} as FastifyReply),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
