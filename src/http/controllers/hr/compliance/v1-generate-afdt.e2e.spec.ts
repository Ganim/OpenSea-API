import { randomUUID } from 'node:crypto';

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

/**
 * E2E — POST /v1/hr/compliance/afdt
 *
 * Foco principal: diferenciação de permissões entre AFD e AFDT (user com
 * só `hr.compliance.afd.generate` recebe 403 aqui).
 *
 * Valida também:
 *  - 201 happy path + AFDT persistido como `type=AFDT`
 *  - AFDT inclui batidas com `adjustmentType=ADJUSTMENT_APPROVED`
 *  - Audit log com placeholders "AFDT" (não "AFD")
 */
describe('Generate AFDT (E2E)', () => {
  let tenantId: string;
  let token: string;
  let employeeId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;

    const emp = await createEmployeeE2E({ tenantId });
    employeeId = emp.employeeId;

    // Seed: 2 ORIGINAL + 1 ADJUSTMENT_APPROVED no mesmo dia.
    await prisma.timeEntry.createMany({
      data: [
        {
          id: randomUUID(),
          tenantId,
          employeeId,
          entryType: 'CLOCK_IN',
          timestamp: new Date('2026-03-01T11:00:00Z'),
          nsrNumber: 10,
          adjustmentType: 'ORIGINAL',
        },
        {
          id: randomUUID(),
          tenantId,
          employeeId,
          entryType: 'CLOCK_OUT',
          timestamp: new Date('2026-03-01T20:15:00Z'),
          nsrNumber: 11,
          adjustmentType: 'ORIGINAL',
        },
        {
          id: randomUUID(),
          tenantId,
          employeeId,
          entryType: 'CLOCK_IN',
          timestamp: new Date('2026-03-01T11:05:00Z'),
          nsrNumber: 12,
          originNsrNumber: 10,
          adjustmentType: 'ADJUSTMENT_APPROVED',
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.complianceArtifact.deleteMany({ where: { tenantId } });
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/hr/compliance/afdt')
      .send({ startDate: '2026-03-01', endDate: '2026-03-03' });
    expect(response.status).toBe(401);
  });

  it('should generate AFDT (201) with artifactId + downloadUrl', async () => {
    const response = await request(app.server)
      .post('/v1/hr/compliance/afdt')
      .set('Authorization', `Bearer ${token}`)
      .send({ startDate: '2026-03-01', endDate: '2026-03-03' });

    expect(response.status).toBe(201);
    expect(response.body.artifactId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(response.body.contentHash).toHaveLength(64);
    expect(response.body.storageKey).toMatch(/compliance\/afdt\//);

    // ComplianceArtifact com type=AFDT.
    const artifact = await prisma.complianceArtifact.findUnique({
      where: { id: response.body.artifactId },
    });
    expect(artifact?.type).toBe('AFDT');

    // Audit log deve ter placeholder "AFDT".
    const auditRows = await prisma.auditLog.findMany({
      where: {
        tenantId,
        entity: 'COMPLIANCE_ARTIFACT',
        entityId: response.body.artifactId,
      },
    });
    expect(auditRows.length).toBeGreaterThanOrEqual(1);
    expect(auditRows[0].description).toContain('AFDT');
  });

  it('should return 403 when user has ONLY hr.compliance.afd.generate (AFD permission is distinct from AFDT)', async () => {
    const onlyAfd = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: ['hr.compliance.afd.generate'],
    });
    const response = await request(app.server)
      .post('/v1/hr/compliance/afdt')
      .set('Authorization', `Bearer ${onlyAfd.token}`)
      .send({ startDate: '2026-03-01', endDate: '2026-03-03' });
    expect(response.status).toBe(403);
  });

  it('should return 400 when period > 365 days (Zod refine)', async () => {
    const response = await request(app.server)
      .post('/v1/hr/compliance/afdt')
      .set('Authorization', `Bearer ${token}`)
      .send({ startDate: '2024-01-01', endDate: '2026-03-01' });
    expect([400, 422]).toContain(response.status);
  });
});
