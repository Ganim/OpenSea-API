import { createHash } from 'node:crypto';
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

describe('Rotate QR Token individual (E2E)', () => {
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
        '/v1/hr/employees/00000000-0000-0000-0000-000000000000/qr-token/rotate',
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
      .post(`/v1/hr/employees/${employee.id}/qr-token/rotate`)
      .set('Authorization', `Bearer ${unauthorized.token}`);
    expect(res.status).toBe(403);
  });

  it('rotates the token, persists sha256 hash, old hash stops resolving', async () => {
    const employee = await createEmployee(token);

    const first = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/qr-token/rotate`)
      .set('Authorization', `Bearer ${token}`);

    expect(first.status).toBe(200);
    expect(first.body.token).toMatch(/^[a-f0-9]{64}$/);
    expect(typeof first.body.rotatedAt).toBe('string');

    const firstHash = createHash('sha256')
      .update(first.body.token)
      .digest('hex');

    const persisted = (await prisma.employee.findUnique({
      where: { id: employee.id },
      select: { qrTokenHash: true, qrTokenSetAt: true } as never,
    })) as unknown as {
      qrTokenHash: string | null;
      qrTokenSetAt: Date | null;
    };
    expect(persisted.qrTokenHash).toBe(firstHash);
    expect(persisted.qrTokenSetAt).toBeInstanceOf(Date);

    // Rotate again — new hash replaces the old one.
    const second = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/qr-token/rotate`)
      .set('Authorization', `Bearer ${token}`);

    expect(second.status).toBe(200);
    const secondHash = createHash('sha256')
      .update(second.body.token)
      .digest('hex');
    expect(firstHash).not.toBe(secondHash);

    const persistedAfter = (await prisma.employee.findUnique({
      where: { id: employee.id },
      select: { qrTokenHash: true } as never,
    })) as unknown as { qrTokenHash: string | null };
    expect(persistedAfter.qrTokenHash).toBe(secondHash);
  });

  it('writes a PUNCH_QR_TOKEN audit log on each rotation', async () => {
    const employee = await createEmployee(token);

    const before = await prisma.auditLog.count({
      where: { entity: 'PUNCH_QR_TOKEN', entityId: employee.id },
    });

    const res = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/qr-token/rotate`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);

    const after = await prisma.auditLog.count({
      where: { entity: 'PUNCH_QR_TOKEN', entityId: employee.id },
    });
    expect(after).toBe(before + 1);
  });
});
