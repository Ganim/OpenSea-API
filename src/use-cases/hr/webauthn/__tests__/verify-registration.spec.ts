/**
 * Unit tests: VerifyRegistrationUseCase — Plan 10-07.
 *
 * Tests:
 *   1. Happy path: verifyRegistrationResponse verified=true → creates credential + audit BIO_ENROLLED.
 *   2. Challenge missing/expired → throws BadRequestError.
 *   3. verifyRegistrationResponse returns verified=false → throws BadRequestError.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  get: vi.fn<() => Promise<string | null>>(),
  del: vi.fn<() => Promise<number>>(),
  getRedisClient: vi.fn(),
  verifyRegistrationResponse: vi.fn(),
}));

vi.mock('@/lib/redis', () => ({
  getRedisClient: mocks.getRedisClient,
}));

vi.mock('@simplewebauthn/server', () => ({
  verifyRegistrationResponse: mocks.verifyRegistrationResponse,
}));

vi.mock('@/@env', () => ({
  env: {
    WEBAUTHN_RP_ID: 'opensea.test',
    WEBAUTHN_ORIGIN: 'http://localhost:3333',
    WEBAUTHN_REGISTRATION_TIMEOUT_SEC: 300,
  },
}));

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryWebAuthnCredentialsRepository } from '@/repositories/in-memory/in-memory-webauthn-credentials.repo';
import { VerifyRegistrationUseCase } from '../verify-registration';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeAuditRepo() {
  const logFn = vi.fn().mockResolvedValue({ id: 'audit-1' });
  return { log: logFn };
}

function makeRegistrationInfo() {
  return {
    credential: {
      id: Buffer.from('cred-id-bytes').toString('base64url'),
      publicKey: new Uint8Array([1, 2, 3, 4]),
      counter: 0,
      transports: ['internal'],
    },
    credentialDeviceType: 'platform',
    credentialBackedUp: false,
  };
}

// ── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getRedisClient.mockReturnValue({ get: mocks.get, del: mocks.del });
  mocks.del.mockResolvedValue(1);
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('VerifyRegistrationUseCase', () => {
  it('creates WebAuthnCredential and emits BIO_ENROLLED audit on success', async () => {
    mocks.get.mockResolvedValue('stored-challenge-xyz');
    mocks.verifyRegistrationResponse.mockResolvedValue({
      verified: true,
      registrationInfo: makeRegistrationInfo(),
    });

    const repo = new InMemoryWebAuthnCredentialsRepository();
    const auditRepo = makeAuditRepo();
    const useCase = new VerifyRegistrationUseCase(repo, auditRepo);

    const result = await useCase.execute({
      tenantId: 'tenant-1',
      employeeId: 'emp-1',
      response: { id: 'fake-response' },
    });

    expect(result.verified).toBe(true);
    expect(result.credentialId).toBeTruthy();

    // Credential row created
    expect(repo.items).toHaveLength(1);
    expect(repo.items[0].employeeId).toBe('emp-1');

    // Challenge consumed (DEL called)
    expect(mocks.del).toHaveBeenCalledWith('webauthn:reg:emp-1');

    // Audit BIO_ENROLLED emitted
    expect(auditRepo.log).toHaveBeenCalledTimes(1);
    const auditCall = auditRepo.log.mock.calls[0][0];
    expect(auditCall.action).toContain('BIO_ENROLLED');
    // LGPD: publicKey must NOT appear in audit newData
    expect(JSON.stringify(auditCall.newData)).not.toContain('publicKey');
  });

  it('throws BadRequestError when challenge is missing/expired', async () => {
    mocks.get.mockResolvedValue(null); // no challenge in Redis

    const repo = new InMemoryWebAuthnCredentialsRepository();
    const auditRepo = makeAuditRepo();
    const useCase = new VerifyRegistrationUseCase(repo, auditRepo);

    await expect(
      useCase.execute({
        tenantId: 'tenant-1',
        employeeId: 'emp-1',
        response: { id: 'fake-response' },
      }),
    ).rejects.toThrow(BadRequestError);

    expect(mocks.verifyRegistrationResponse).not.toHaveBeenCalled();
  });

  it('throws BadRequestError when verifyRegistrationResponse returns verified=false', async () => {
    mocks.get.mockResolvedValue('challenge-abc');
    mocks.verifyRegistrationResponse.mockResolvedValue({
      verified: false,
      registrationInfo: undefined,
    });

    const repo = new InMemoryWebAuthnCredentialsRepository();
    const auditRepo = makeAuditRepo();
    const useCase = new VerifyRegistrationUseCase(repo, auditRepo);

    await expect(
      useCase.execute({
        tenantId: 'tenant-1',
        employeeId: 'emp-1',
        response: { id: 'fake-response' },
      }),
    ).rejects.toThrow(BadRequestError);

    // Challenge still consumed even on failure (prevent retry with same challenge)
    expect(mocks.del).toHaveBeenCalledWith('webauthn:reg:emp-1');

    // No credential created
    expect(repo.items).toHaveLength(0);
  });
});
