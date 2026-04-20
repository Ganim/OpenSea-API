import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { generateEmployeeData } from '@/utils/tests/factories/hr/create-employee.e2e';

async function createEmployee(token: string) {
  const res = await request(app.server)
    .post('/v1/hr/employees')
    .set('Authorization', `Bearer ${token}`)
    .send(generateEmployeeData());
  return res.body.employee as { id: string; fullName: string };
}

describe('Unlock Punch PIN (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const tenant = await createAndSetupTenant();
    tenantId = tenant.tenantId;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  it('returns 404 for non-existent employee', async () => {
    const res = await request(app.server)
      .post(
        '/v1/hr/employees/00000000-0000-0000-0000-000000000000/unlock-punch-pin',
      )
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('returns 403 for user without hr.punch-devices.admin permission', async () => {
    const employee = await createEmployee(token);
    const unauthorized = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: [],
    });
    const res = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/unlock-punch-pin`)
      .set('Authorization', `Bearer ${unauthorized.token}`);
    expect(res.status).toBe(403);
  });

  it('clears lockedUntil / failedAttempts / lastFailedAt on a locked employee', async () => {
    const employee = await createEmployee(token);

    // Seed the employee into a locked state directly via Prisma so the test
    // does not need to actually trigger 5 failed PIN attempts end-to-end.
    const lockedUntil = new Date(Date.now() + 10 * 60 * 1000);
    await prisma.employee.update({
      where: { id: employee.id },
      data: {
        punchPinFailedAttempts: 5,
        punchPinLockedUntil: lockedUntil,
        punchPinLastFailedAt: new Date(),
      } as never,
    });

    const res = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/unlock-punch-pin`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(typeof res.body.unlockedAt).toBe('string');

    const persisted = (await prisma.employee.findUnique({
      where: { id: employee.id },
      select: {
        punchPinFailedAttempts: true,
        punchPinLockedUntil: true,
        punchPinLastFailedAt: true,
      } as never,
    })) as unknown as {
      punchPinFailedAttempts: number;
      punchPinLockedUntil: Date | null;
      punchPinLastFailedAt: Date | null;
    };

    expect(persisted.punchPinFailedAttempts).toBe(0);
    expect(persisted.punchPinLockedUntil).toBeNull();
    expect(persisted.punchPinLastFailedAt).toBeNull();
  });

  it('is idempotent — second call on already-unlocked employee returns 200', async () => {
    const employee = await createEmployee(token);

    const first = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/unlock-punch-pin`)
      .set('Authorization', `Bearer ${token}`);
    expect(first.status).toBe(200);

    const second = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/unlock-punch-pin`)
      .set('Authorization', `Bearer ${token}`);
    expect(second.status).toBe(200);
  });

  it('writes a PUNCH_PIN audit log on unlock', async () => {
    const employee = await createEmployee(token);

    const before = await prisma.auditLog.count({
      where: { entity: 'PUNCH_PIN', entityId: employee.id },
    });

    const res = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/unlock-punch-pin`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);

    const after = await prisma.auditLog.count({
      where: { entity: 'PUNCH_PIN', entityId: employee.id },
    });
    expect(after).toBe(before + 1);
  });
});
