/**
 * POST /v1/hr/punch-bio/enroll-pin — E2E spec (Plan 10-04 Task 4.3)
 *
 * 7 scenarios:
 *   1. POST sem JWT → 401
 *   2. JWT mas sem permission hr.bio.enroll → 403
 *   3. Permission OK mas sem x-action-pin-token header → 403
 *   4. PIN token inválido (signature wrong) → 403
 *   5. PIN válido + body válido → 200 + auditLogId
 *   6. Body com campo extra (iso_template_blob) → 400 (Zod strict)
 *   7. avgScore < 50 → 400 (server-side quality gate)
 *
 * LGPD invariant: audit log newData NEVER contains iso_template or template_blob
 *
 * Pattern: v1-batch-resolve-punch-approvals.e2e.spec.ts (Phase 7)
 */
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { getJwtSecret, isUsingRS256, jwtConfig } from '@/config/jwt';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

/**
 * Issue a short-lived action-pin JWT for the given userId.
 * Mirrors the helper in batch-resolve e2e spec.
 */
function issueActionPinToken(userId: string): string {
  const now = Math.floor(Date.now() / 1000);
  const secret = getJwtSecret();
  const signKey = typeof secret === 'string' ? secret : secret.private;
  return jwt.sign({ scope: 'action-pin', sub: userId, iat: now }, signKey, {
    algorithm: isUsingRS256() ? 'RS256' : 'HS256',
    expiresIn: '60s',
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
  });
}

describe('POST /v1/hr/punch-bio/enroll-pin (E2E)', () => {
  let tenantId: string;
  let token: string;
  let userId: string;
  let employeeId: string;
  let deviceId: string;

  const validQualityScores = [80, 85, 90];
  const validAvgScore = 85;

  beforeAll(async () => {
    await app.ready();

    const tenant = await createAndSetupTenant();
    tenantId = tenant.tenantId;

    // Admin user with hr.bio.enroll permission
    const auth = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: ['hr.bio.enroll'],
    });
    token = auth.token;
    userId = auth.user.user.id;

    // Create employee
    const emp = await createEmployeeE2E({ tenantId });
    employeeId = emp.employeeId;

    // Create a paired punch device (use actual Prisma schema fields)
    const device = await prisma.punchDevice.create({
      data: {
        tenantId,
        name: 'Test Kiosk E2E',
        deviceKind: 'BIOMETRIC_READER',
        pairingSecret: `secret-${Date.now()}`,
        deviceLabel: 'Recepção — E2E',
        status: 'ONLINE',
      },
    });
    deviceId = device.id;
  });

  // ── Test 1: No JWT ─────────────────────────────────────────────────────────
  it('POST sem JWT → 401', async () => {
    const res = await request(app.server)
      .post('/v1/hr/punch-bio/enroll-pin')
      .send({
        deviceId,
        targetEmployeeId: employeeId,
        qualityScores: validQualityScores,
        avgScore: validAvgScore,
      });

    expect(res.status).toBe(401);
  });

  // ── Test 2: No permission ──────────────────────────────────────────────────
  it('JWT sem permission hr.bio.enroll → 403', async () => {
    const noPerm = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: [],
    });

    const res = await request(app.server)
      .post('/v1/hr/punch-bio/enroll-pin')
      .set('Authorization', `Bearer ${noPerm.token}`)
      .send({
        deviceId,
        targetEmployeeId: employeeId,
        qualityScores: validQualityScores,
        avgScore: validAvgScore,
      });

    expect(res.status).toBe(403);
  });

  // ── Test 3: No action-pin-token ────────────────────────────────────────────
  it('Permission OK mas sem x-action-pin-token → 403', async () => {
    const res = await request(app.server)
      .post('/v1/hr/punch-bio/enroll-pin')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId,
        targetEmployeeId: employeeId,
        qualityScores: validQualityScores,
        avgScore: validAvgScore,
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/PIN/i);
  });

  // ── Test 4: Invalid action-pin-token ──────────────────────────────────────
  it('x-action-pin-token inválido (assinatura errada) → 403', async () => {
    const badToken = jwt.sign(
      { scope: 'action-pin', sub: userId, iat: Math.floor(Date.now() / 1000) },
      'wrong-secret-key',
      { expiresIn: '60s' },
    );

    const res = await request(app.server)
      .post('/v1/hr/punch-bio/enroll-pin')
      .set('Authorization', `Bearer ${token}`)
      .set('x-action-pin-token', badToken)
      .send({
        deviceId,
        targetEmployeeId: employeeId,
        qualityScores: validQualityScores,
        avgScore: validAvgScore,
      });

    expect(res.status).toBe(403);
  });

  // ── Test 5: Happy path ─────────────────────────────────────────────────────
  it('PIN válido + body válido → 200 + auditLogId + BIO_ENROLLED audit', async () => {
    const pinToken = issueActionPinToken(userId);

    const auditCountBefore = await prisma.auditLog.count({
      where: { action: 'BIO_ENROLLED', tenantId },
    });

    const res = await request(app.server)
      .post('/v1/hr/punch-bio/enroll-pin')
      .set('Authorization', `Bearer ${token}`)
      .set('x-action-pin-token', pinToken)
      .send({
        deviceId,
        targetEmployeeId: employeeId,
        qualityScores: validQualityScores,
        avgScore: validAvgScore,
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(typeof res.body.auditLogId).toBe('string');

    // Audit log must be written
    const auditCountAfter = await prisma.auditLog.count({
      where: { action: 'BIO_ENROLLED', tenantId },
    });
    expect(auditCountAfter).toBeGreaterThan(auditCountBefore);

    // LGPD: audit newData must NOT contain template data
    const auditLog = await prisma.auditLog.findFirst({
      where: { action: 'BIO_ENROLLED', tenantId },
      orderBy: { createdAt: 'desc' },
    });
    const newDataStr = JSON.stringify(auditLog?.newData ?? {});
    expect(newDataStr).not.toMatch(/iso_template|template_blob|fmd/i);
    expect(newDataStr).toContain('qualityScores');
  });

  // ── Test 6: Zod strict rejects extra fields (LGPD invariant) ─────────────
  it('Body com iso_template_blob → 400 (Zod strict rejects unknown field)', async () => {
    const pinToken = issueActionPinToken(userId);

    const res = await request(app.server)
      .post('/v1/hr/punch-bio/enroll-pin')
      .set('Authorization', `Bearer ${token}`)
      .set('x-action-pin-token', pinToken)
      .send({
        deviceId,
        targetEmployeeId: employeeId,
        qualityScores: validQualityScores,
        avgScore: validAvgScore,
        iso_template_blob: 'AAECBA==', // should be rejected by .strict()
      });

    expect(res.status).toBe(400);
  });

  // ── Test 7: avgScore below minimum ────────────────────────────────────────
  it('avgScore < 50 → 400 (qualidade insuficiente)', async () => {
    const pinToken = issueActionPinToken(userId);

    const res = await request(app.server)
      .post('/v1/hr/punch-bio/enroll-pin')
      .set('Authorization', `Bearer ${token}`)
      .set('x-action-pin-token', pinToken)
      .send({
        deviceId,
        targetEmployeeId: employeeId,
        qualityScores: [30, 40, 45],
        avgScore: 38.3,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/avgScore|50/i);
  });
});
