/**
 * Unit tests: GenerateRegistrationOptionsUseCase — Plan 10-07.
 *
 * Tests:
 *   1. Returns options with excludeCredentials populated from existing credentials.
 *   2. Persists challenge in Redis with TTL (WEBAUTHN_REGISTRATION_TIMEOUT_SEC).
 *   3. Returns empty excludeCredentials when employee has no credentials.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  setex: vi.fn<() => Promise<number>>().mockResolvedValue(1),
  getRedisClient: vi.fn(),
  generateRegistrationOptions: vi.fn(),
}));

vi.mock('@/lib/redis', () => ({
  getRedisClient: mocks.getRedisClient,
}));

vi.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: mocks.generateRegistrationOptions,
}));

// Mock env with predictable defaults
vi.mock('@/@env', () => ({
  env: {
    WEBAUTHN_RP_ID: 'opensea.test',
    WEBAUTHN_ORIGIN: 'http://localhost:3333',
    WEBAUTHN_REGISTRATION_TIMEOUT_SEC: 300,
  },
}));

import { randomUUID } from 'node:crypto';
import { InMemoryWebAuthnCredentialsRepository } from '@/repositories/in-memory/in-memory-webauthn-credentials.repo';
import { GenerateRegistrationOptionsUseCase } from '../generate-registration-options';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeCredential(
  overrides: Partial<{
    id: string;
    credentialId: Buffer;
    employeeId: string;
    transports: string[];
  }> = {},
) {
  return {
    id: overrides.id ?? randomUUID(),
    tenantId: 'tenant-1',
    employeeId: overrides.employeeId ?? 'emp-1',
    credentialId: overrides.credentialId ?? Buffer.from('cred-1'),
    publicKey: Buffer.from('pubkey'),
    counter: BigInt(0),
    transports: overrides.transports ?? ['internal'],
    deviceType: 'platform',
    backedUp: false,
    lastUsedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// ── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getRedisClient.mockReturnValue({ setex: mocks.setex });
  mocks.generateRegistrationOptions.mockResolvedValue({
    challenge: 'test-challenge-abc123',
    rp: { id: 'opensea.test', name: 'OpenSea' },
    user: { id: 'emp-1', name: 'Ana Lima', displayName: 'Ana Lima' },
    pubKeyCredParams: [],
    timeout: 300000,
    excludeCredentials: [],
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'required',
    },
    attestation: 'none',
  });
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('GenerateRegistrationOptionsUseCase', () => {
  it('returns options with excludeCredentials populated from existing credentials', async () => {
    const repo = new InMemoryWebAuthnCredentialsRepository();
    const existing = makeCredential({
      employeeId: 'emp-1',
      transports: ['usb'],
    });
    repo.items.push(existing);

    const useCase = new GenerateRegistrationOptionsUseCase(repo);
    const result = await useCase.execute({
      tenantId: 'tenant-1',
      employeeId: 'emp-1',
      employeeName: 'Ana Lima',
    });

    // @simplewebauthn/server mock was called with excludeCredentials containing the stored cred
    const callArgs = mocks.generateRegistrationOptions.mock.calls[0][0];
    expect(callArgs.excludeCredentials).toHaveLength(1);
    expect(callArgs.excludeCredentials[0].id).toEqual(existing.credentialId);
    expect(callArgs.excludeCredentials[0].transports).toEqual(['usb']);
    expect(result.challenge).toBe('test-challenge-abc123');
  });

  it('persists challenge in Redis with TTL=300', async () => {
    const repo = new InMemoryWebAuthnCredentialsRepository();

    const useCase = new GenerateRegistrationOptionsUseCase(repo);
    await useCase.execute({
      tenantId: 'tenant-1',
      employeeId: 'emp-42',
      employeeName: 'João Silva',
    });

    expect(mocks.setex).toHaveBeenCalledWith(
      'webauthn:reg:emp-42',
      300,
      'test-challenge-abc123',
    );
  });

  it('returns empty excludeCredentials when employee has no credentials', async () => {
    const repo = new InMemoryWebAuthnCredentialsRepository(); // no items

    const useCase = new GenerateRegistrationOptionsUseCase(repo);
    await useCase.execute({
      tenantId: 'tenant-1',
      employeeId: 'emp-new',
      employeeName: 'Maria Nova',
    });

    const callArgs = mocks.generateRegistrationOptions.mock.calls[0][0];
    expect(callArgs.excludeCredentials).toHaveLength(0);
  });
});
