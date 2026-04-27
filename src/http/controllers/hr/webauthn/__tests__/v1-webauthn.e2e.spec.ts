/**
 * WebAuthn endpoints — E2E spec (Plan 10-07 Task 7.2)
 *
 * 6 scenarios:
 *   1. POST /register-options sem x-punch-device-token → 401
 *   2. POST /register-options com token válido + employeeId → 200 + challenge
 *   3. POST /register com challenge consumido → 200 + verified:true + credentialId
 *   4. POST /authenticate-options + employeeId → 200 + allowCredentials
 *   5. POST /authenticate happy path → 200 + verified:true + employeeId
 *   6. POST /authenticate counter regression → 400 BadRequestError
 *
 * Auth: x-punch-device-token (verifyPunchDeviceToken — no JWT for WebAuthn endpoints).
 *
 * NOTE: @simplewebauthn/server calls are stubbed (vi.mock) because no real
 * WebAuthn hardware is available in the test environment. The stubs produce
 * deterministic, spec-compliant responses.
 *
 * Pattern: v1-notify-update-failed.e2e.spec.ts (Plan 10-06)
 */
import { createHash } from 'node:crypto';
import request from 'supertest';
import { beforeAll, describe, expect, it, vi } from 'vitest';

// ── Stub @simplewebauthn/server ───────────────────────────────────────────────
// Must be defined before any import of the module-under-test.

const FAKE_REG_CHALLENGE = 'reg-challenge-abc123';
const FAKE_AUTH_CHALLENGE = 'auth-challenge-xyz789';
const FAKE_CREDENTIAL_ID =
  Buffer.from('fake-cred-id-bytes').toString('base64url');
const FAKE_PUBLIC_KEY = Buffer.from([0x04, 0x01, 0x02, 0x03]);

const mocks = vi.hoisted(() => ({
  generateRegistrationOptions: vi.fn(),
  verifyRegistrationResponse: vi.fn(),
  generateAuthenticationOptions: vi.fn(),
  verifyAuthenticationResponse: vi.fn(),
  getRedisSetex: vi.fn<() => Promise<number>>().mockResolvedValue(1),
  getRedisGet: vi.fn<() => Promise<string | null>>(),
  getRedisGetAfterAuth: vi.fn<() => Promise<string | null>>(),
  getRedisDel: vi.fn<() => Promise<number>>().mockResolvedValue(1),
}));

vi.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: mocks.generateRegistrationOptions,
  verifyRegistrationResponse: mocks.verifyRegistrationResponse,
  generateAuthenticationOptions: mocks.generateAuthenticationOptions,
  verifyAuthenticationResponse: mocks.verifyAuthenticationResponse,
}));

vi.mock('@/lib/redis', () => ({
  getRedisClient: vi.fn(() => ({
    setex: mocks.getRedisSetex,
    get: mocks.getRedisGet,
    del: mocks.getRedisDel,
  })),
}));

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

// ── Setup ────────────────────────────────────────────────────────────────────

describe('WebAuthn endpoints (E2E)', () => {
  let tenantId: string;
  let employeeId: string;
  let validToken: string;
  let revokedToken: string;

  beforeAll(async () => {
    await app.ready();

    const tenant = await createAndSetupTenant();
    tenantId = tenant.tenantId;

    const emp = await createEmployeeE2E({ tenantId });
    employeeId = emp.employeeId;

    // Create a paired punch device with a valid token hash
    validToken = `webauthn-device-token-${Date.now()}`;
    const validTokenHash = createHash('sha256')
      .update(validToken)
      .digest('hex');
    await prisma.punchDevice.create({
      data: {
        tenantId,
        name: 'WebAuthn Test Device E2E',
        deviceKind: 'WEBAUTHN_PC',
        pairingSecret: `secret-webauthn-${Date.now()}`,
        deviceLabel: 'Windows Hello — E2E',
        deviceTokenHash: validTokenHash,
        status: 'ONLINE',
      },
    });

    // Revoked token
    revokedToken = `revoked-webauthn-token-${Date.now()}`;
    const revokedTokenHash = createHash('sha256')
      .update(revokedToken)
      .digest('hex');
    await prisma.punchDevice.create({
      data: {
        tenantId,
        name: 'Revoked WebAuthn Device E2E',
        deviceKind: 'WEBAUTHN_PC',
        pairingSecret: `secret-revoked-webauthn-${Date.now()}`,
        deviceLabel: 'Revogado — E2E',
        deviceTokenHash: revokedTokenHash,
        status: 'OFFLINE',
        revokedAt: new Date(),
      },
    });

    // Default mock implementations
    mocks.generateRegistrationOptions.mockResolvedValue({
      challenge: FAKE_REG_CHALLENGE,
      rp: { id: 'opensea.test', name: 'OpenSea' },
      user: {
        id: employeeId,
        name: 'Test Employee',
        displayName: 'Test Employee',
      },
      pubKeyCredParams: [],
      timeout: 300000,
      excludeCredentials: [],
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'required',
        authenticatorAttachment: 'platform',
      },
      attestation: 'none',
    });

    mocks.verifyRegistrationResponse.mockResolvedValue({
      verified: true,
      registrationInfo: {
        credential: {
          id: FAKE_CREDENTIAL_ID,
          publicKey: FAKE_PUBLIC_KEY,
          counter: 0,
          transports: ['internal'],
        },
        credentialDeviceType: 'platform',
        credentialBackedUp: false,
      },
    });

    mocks.generateAuthenticationOptions.mockResolvedValue({
      challenge: FAKE_AUTH_CHALLENGE,
      rpId: 'opensea.test',
      allowCredentials: [],
      userVerification: 'required',
      timeout: 300000,
    });
  });

  // ── Test 1: No device token → 401 ────────────────────────────────────────
  it('POST /register-options sem x-punch-device-token → 401', async () => {
    const res = await request(app.server)
      .post('/v1/hr/webauthn/register-options')
      .send({ employeeId });

    expect(res.status).toBe(401);
  });

  // ── Test 2: register-options → 200 + challenge ────────────────────────────
  it('POST /register-options com token válido → 200 + challenge', async () => {
    mocks.getRedisGet.mockResolvedValue(null); // no existing challenge
    mocks.getRedisSetex.mockResolvedValue(1);

    const res = await request(app.server)
      .post('/v1/hr/webauthn/register-options')
      .set('x-punch-device-token', validToken)
      .send({ employeeId });

    expect(res.status).toBe(200);
    expect(res.body.challenge).toBe(FAKE_REG_CHALLENGE);
    expect(mocks.generateRegistrationOptions).toHaveBeenCalled();
    // Redis setex called to persist challenge
    expect(mocks.getRedisSetex).toHaveBeenCalledWith(
      `webauthn:reg:${employeeId}`,
      expect.any(Number),
      FAKE_REG_CHALLENGE,
    );
  });

  // ── Test 3: register → 200 + credentialId ─────────────────────────────────
  it('POST /register com challenge válido → 200 + verified:true + credentialId', async () => {
    // Redis returns stored challenge
    mocks.getRedisGet.mockResolvedValue(FAKE_REG_CHALLENGE);

    const res = await request(app.server)
      .post('/v1/hr/webauthn/register')
      .set('x-punch-device-token', validToken)
      .send({
        employeeId,
        response: {
          id: FAKE_CREDENTIAL_ID,
          rawId: FAKE_CREDENTIAL_ID,
          type: 'public-key',
          response: {
            clientDataJSON: 'stub',
            attestationObject: 'stub',
          },
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.verified).toBe(true);
    expect(typeof res.body.credentialId).toBe('string');

    // Credential row created in DB
    const cred = await prisma.webAuthnCredential.findFirst({
      where: { employeeId, tenantId },
    });
    expect(cred).not.toBeNull();
  });

  // ── Test 4: authenticate-options → 200 + allowCredentials ─────────────────
  it('POST /authenticate-options → 200 + challenge', async () => {
    mocks.getRedisSetex.mockResolvedValue(1);

    const res = await request(app.server)
      .post('/v1/hr/webauthn/authenticate-options')
      .set('x-punch-device-token', validToken)
      .send({ employeeId });

    expect(res.status).toBe(200);
    expect(res.body.challenge).toBe(FAKE_AUTH_CHALLENGE);
    expect(mocks.getRedisSetex).toHaveBeenCalledWith(
      `webauthn:auth:${employeeId}`,
      expect.any(Number),
      FAKE_AUTH_CHALLENGE,
    );
  });

  // ── Test 5: authenticate happy path → 200 + employeeId ────────────────────
  it('POST /authenticate happy path → 200 + verified:true + employeeId', async () => {
    // First ensure a credential row exists with counter=0 (from Test 3)
    const cred = await prisma.webAuthnCredential.findFirst({
      where: { employeeId, tenantId },
    });
    expect(cred).not.toBeNull();

    // Stub: challenge in Redis + verification returns verified=true + counter 1
    mocks.getRedisGet.mockResolvedValue(FAKE_AUTH_CHALLENGE);
    mocks.verifyAuthenticationResponse.mockResolvedValue({
      verified: true,
      authenticationInfo: { newCounter: 1 },
    });

    const res = await request(app.server)
      .post('/v1/hr/webauthn/authenticate')
      .set('x-punch-device-token', validToken)
      .send({
        response: {
          id: FAKE_CREDENTIAL_ID,
          rawId: FAKE_CREDENTIAL_ID,
          type: 'public-key',
          response: {
            clientDataJSON: 'stub',
            authenticatorData: 'stub',
            signature: 'stub',
          },
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.verified).toBe(true);
    expect(res.body.employeeId).toBe(employeeId);
    expect(res.body.tenantId).toBe(tenantId);

    // Counter updated in DB
    const updatedCred = await prisma.webAuthnCredential.findFirst({
      where: { employeeId, tenantId },
    });
    expect(Number(updatedCred!.counter)).toBe(1);
  });

  // ── Test 6: authenticate counter regression → 400 ─────────────────────────
  it('POST /authenticate counter regression → 400 BadRequestError', async () => {
    // Stored counter is now 1 (from Test 5); stub returns newCounter=0 (regression)
    mocks.getRedisGet.mockResolvedValue(FAKE_AUTH_CHALLENGE);
    mocks.verifyAuthenticationResponse.mockResolvedValue({
      verified: true,
      authenticationInfo: { newCounter: 0 }, // regression: 0 <= stored(1)
    });

    const res = await request(app.server)
      .post('/v1/hr/webauthn/authenticate')
      .set('x-punch-device-token', validToken)
      .send({
        response: {
          id: FAKE_CREDENTIAL_ID,
          rawId: FAKE_CREDENTIAL_ID,
          type: 'public-key',
          response: {
            clientDataJSON: 'stub',
            authenticatorData: 'stub',
            signature: 'stub',
          },
        },
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/counter regression/i);
  });
});
