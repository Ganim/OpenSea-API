/**
 * Unit tests: VerifyAuthenticationUseCase — Plan 10-07.
 *
 * Tests:
 *   1. Happy path: verified=true + newCounter > storedCounter → updateCounter + returns { employeeId, tenantId }.
 *   2. Counter regression: newCounter <= storedCounter → throws BadRequestError.
 *   3. Credential not found → throws ResourceNotFoundError.
 *   4. No active challenge → throws BadRequestError.
 *   5. verifyAuthenticationResponse returns verified=false → throws BadRequestError.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  get: vi.fn<() => Promise<string | null>>(),
  del: vi.fn<() => Promise<number>>(),
  getRedisClient: vi.fn(),
  verifyAuthenticationResponse: vi.fn(),
}));

vi.mock('@/lib/redis', () => ({
  getRedisClient: mocks.getRedisClient,
}));

vi.mock('@simplewebauthn/server', () => ({
  verifyAuthenticationResponse: mocks.verifyAuthenticationResponse,
}));

vi.mock('@/@env', () => ({
  env: {
    WEBAUTHN_RP_ID: 'opensea.test',
    WEBAUTHN_ORIGIN: 'http://localhost:3333',
    WEBAUTHN_REGISTRATION_TIMEOUT_SEC: 300,
  },
}));

import { randomUUID } from 'node:crypto';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryWebAuthnCredentialsRepository } from '@/repositories/in-memory/in-memory-webauthn-credentials.repo';
import { VerifyAuthenticationUseCase } from '../verify-authentication';

// ── Helpers ──────────────────────────────────────────────────────────────────

const CRED_ID_BASE64 = Buffer.from('test-credential-id').toString('base64url');

function makeStoredCredential(counter = BigInt(5)) {
  return {
    id: randomUUID(),
    tenantId: 'tenant-1',
    employeeId: 'emp-1',
    credentialId: Buffer.from('test-credential-id'),
    publicKey: Buffer.from([0x04, 0x01, 0x02]),
    counter,
    transports: ['internal'] as string[],
    deviceType: 'platform',
    backedUp: false,
    lastUsedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function makeAuthResponse(credentialId = CRED_ID_BASE64) {
  return { id: credentialId, type: 'public-key' };
}

// ── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getRedisClient.mockReturnValue({ get: mocks.get, del: mocks.del });
  mocks.del.mockResolvedValue(1);
  mocks.get.mockResolvedValue('test-challenge-abc');
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('VerifyAuthenticationUseCase', () => {
  it('happy path: verified=true + counter advances → returns { employeeId, tenantId }', async () => {
    const storedCounter = BigInt(5);
    const newCounter = 6; // strictly greater

    mocks.verifyAuthenticationResponse.mockResolvedValue({
      verified: true,
      authenticationInfo: { newCounter },
    });

    const repo = new InMemoryWebAuthnCredentialsRepository();
    repo.items.push(makeStoredCredential(storedCounter));
    const useCase = new VerifyAuthenticationUseCase(repo);

    const result = await useCase.execute({ response: makeAuthResponse() });

    expect(result.verified).toBe(true);
    expect(result.employeeId).toBe('emp-1');
    expect(result.tenantId).toBe('tenant-1');

    // Counter updated in repo
    expect(repo.items[0].counter).toBe(BigInt(newCounter));

    // Challenge consumed
    expect(mocks.del).toHaveBeenCalledWith('webauthn:auth:emp-1');
  });

  it('COUNTER REGRESSION: newCounter <= storedCounter → throws BadRequestError', async () => {
    const storedCounter = BigInt(10);
    const newCounter = 5; // regression: less than stored

    mocks.verifyAuthenticationResponse.mockResolvedValue({
      verified: true,
      authenticationInfo: { newCounter },
    });

    const repo = new InMemoryWebAuthnCredentialsRepository();
    repo.items.push(makeStoredCredential(storedCounter));
    const useCase = new VerifyAuthenticationUseCase(repo);

    await expect(
      useCase.execute({ response: makeAuthResponse() }),
    ).rejects.toThrow(BadRequestError);

    // Ensure counter regression message mentions the detection
    await expect(
      useCase.execute({ response: makeAuthResponse() }),
    ).rejects.toThrow(/counter regression/i);
  });

  it('COUNTER REGRESSION: newCounter === storedCounter → throws BadRequestError', async () => {
    const storedCounter = BigInt(10);
    const newCounter = 10; // equal = also regression

    mocks.verifyAuthenticationResponse.mockResolvedValue({
      verified: true,
      authenticationInfo: { newCounter },
    });

    const repo = new InMemoryWebAuthnCredentialsRepository();
    repo.items.push(makeStoredCredential(storedCounter));
    const useCase = new VerifyAuthenticationUseCase(repo);

    await expect(
      useCase.execute({ response: makeAuthResponse() }),
    ).rejects.toThrow(BadRequestError);
  });

  it('credential not found → throws ResourceNotFoundError', async () => {
    const repo = new InMemoryWebAuthnCredentialsRepository(); // empty
    const useCase = new VerifyAuthenticationUseCase(repo);

    await expect(
      useCase.execute({ response: makeAuthResponse() }),
    ).rejects.toThrow(ResourceNotFoundError);

    expect(mocks.verifyAuthenticationResponse).not.toHaveBeenCalled();
  });

  it('no active challenge → throws BadRequestError', async () => {
    mocks.get.mockResolvedValue(null); // no challenge

    const repo = new InMemoryWebAuthnCredentialsRepository();
    repo.items.push(makeStoredCredential());
    const useCase = new VerifyAuthenticationUseCase(repo);

    await expect(
      useCase.execute({ response: makeAuthResponse() }),
    ).rejects.toThrow(BadRequestError);

    expect(mocks.verifyAuthenticationResponse).not.toHaveBeenCalled();
  });

  it('verifyAuthenticationResponse returns verified=false → throws BadRequestError', async () => {
    mocks.verifyAuthenticationResponse.mockResolvedValue({
      verified: false,
      authenticationInfo: { newCounter: 6 },
    });

    const repo = new InMemoryWebAuthnCredentialsRepository();
    repo.items.push(makeStoredCredential(BigInt(5)));
    const useCase = new VerifyAuthenticationUseCase(repo);

    await expect(
      useCase.execute({ response: makeAuthResponse() }),
    ).rejects.toThrow(BadRequestError);
  });
});
