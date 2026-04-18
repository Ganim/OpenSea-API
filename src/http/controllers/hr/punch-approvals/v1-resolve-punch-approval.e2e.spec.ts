import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Resolve Punch Approval (E2E)', () => {
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
  });

  async function seedPendingApproval() {
    const te = await prisma.timeEntry.create({
      data: {
        tenantId,
        employeeId,
        entryType: 'CLOCK_IN',
        timestamp: new Date(),
      },
    });
    const approval = await prisma.punchApproval.create({
      data: {
        tenantId,
        timeEntryId: te.id,
        employeeId,
        reason: 'OUT_OF_GEOFENCE',
        details: { distance: 250, zoneId: 'zone-1' },
        status: 'PENDING',
      },
    });
    return approval;
  }

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post(
        '/v1/hr/punch-approvals/00000000-0000-0000-0000-000000000000/resolve',
      )
      .send({ decision: 'APPROVE' });

    expect(response.status).toBe(401);
  });

  it('should APPROVE a pending approval (200)', async () => {
    const approval = await seedPendingApproval();

    const response = await request(app.server)
      .post(`/v1/hr/punch-approvals/${approval.id}/resolve`)
      .set('Authorization', `Bearer ${token}`)
      .send({ decision: 'APPROVE', note: 'GPS alternativo confirma' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('APPROVED');
    expect(response.body.approvalId).toBe(approval.id);
    expect(response.body.resolvedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    const stored = await prisma.punchApproval.findUnique({
      where: { id: approval.id },
    });
    expect(stored?.status).toBe('APPROVED');
    expect(stored?.resolverNote).toBe('GPS alternativo confirma');
    expect(stored?.resolvedAt).toBeInstanceOf(Date);
  });

  it('should REJECT a pending approval (200)', async () => {
    const approval = await seedPendingApproval();

    const response = await request(app.server)
      .post(`/v1/hr/punch-approvals/${approval.id}/resolve`)
      .set('Authorization', `Bearer ${token}`)
      .send({ decision: 'REJECT' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('REJECTED');

    const stored = await prisma.punchApproval.findUnique({
      where: { id: approval.id },
    });
    expect(stored?.status).toBe('REJECTED');
  });

  it('should return 400 on double-resolve (already resolved)', async () => {
    const approval = await seedPendingApproval();

    await request(app.server)
      .post(`/v1/hr/punch-approvals/${approval.id}/resolve`)
      .set('Authorization', `Bearer ${token}`)
      .send({ decision: 'APPROVE' });

    const second = await request(app.server)
      .post(`/v1/hr/punch-approvals/${approval.id}/resolve`)
      .set('Authorization', `Bearer ${token}`)
      .send({ decision: 'REJECT' });

    expect(second.status).toBe(400);
    expect(second.body.message).toMatch(/já resolvida/);
  });

  it('should return 400 on invalid decision', async () => {
    const approval = await seedPendingApproval();

    const response = await request(app.server)
      .post(`/v1/hr/punch-approvals/${approval.id}/resolve`)
      .set('Authorization', `Bearer ${token}`)
      .send({ decision: 'FOO' });

    // 400 do Zod schema OU 400 do BadRequestError (ambos aceitáveis)
    expect([400, 422]).toContain(response.status);
  });

  it('should return 404 for non-existent approval id', async () => {
    const response = await request(app.server)
      .post(
        '/v1/hr/punch-approvals/00000000-0000-0000-0000-000000000000/resolve',
      )
      .set('Authorization', `Bearer ${token}`)
      .send({ decision: 'APPROVE' });

    expect(response.status).toBe(404);
  });
});
