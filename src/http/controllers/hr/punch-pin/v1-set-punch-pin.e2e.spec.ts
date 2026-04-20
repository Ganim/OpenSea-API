import bcrypt from 'bcryptjs';
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

describe('Set Punch PIN (E2E)', () => {
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
      .post('/v1/hr/employees/00000000-0000-0000-0000-000000000000/punch-pin')
      .set('Authorization', `Bearer ${token}`)
      .send({ pin: '735194' });
    expect(res.status).toBe(404);
  });

  it('returns 403 for user without hr.punch-devices.admin permission', async () => {
    const employee = await createEmployee(token);
    const unauthorized = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: [],
    });
    const res = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/punch-pin`)
      .set('Authorization', `Bearer ${unauthorized.token}`)
      .send({ pin: '735194' });
    expect(res.status).toBe(403);
  });

  it('rejects PIN with wrong length via Zod (400)', async () => {
    const employee = await createEmployee(token);
    const res = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/punch-pin`)
      .set('Authorization', `Bearer ${token}`)
      .send({ pin: '12345' });
    expect(res.status).toBe(400);
  });

  it('rejects weak PIN 123456 with WeakPinError (400)', async () => {
    const employee = await createEmployee(token);
    const res = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/punch-pin`)
      .set('Authorization', `Bearer ${token}`)
      .send({ pin: '123456' });
    expect(res.status).toBe(400);
    expect(typeof res.body.message).toBe('string');
  });

  it('persists a bcrypt hash verifiable via bcrypt.compare', async () => {
    const employee = await createEmployee(token);
    const res = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/punch-pin`)
      .set('Authorization', `Bearer ${token}`)
      .send({ pin: '735194' });

    expect(res.status).toBe(200);
    expect(typeof res.body.setAt).toBe('string');

    const persisted = (await prisma.employee.findUnique({
      where: { id: employee.id },
      select: {
        punchPinHash: true,
        punchPinSetAt: true,
        punchPinFailedAttempts: true,
        punchPinLockedUntil: true,
      } as never,
    })) as unknown as {
      punchPinHash: string | null;
      punchPinSetAt: Date | null;
      punchPinFailedAttempts: number;
      punchPinLockedUntil: Date | null;
    };
    expect(persisted.punchPinHash).toBeTruthy();
    expect(persisted.punchPinSetAt).toBeInstanceOf(Date);
    expect(persisted.punchPinFailedAttempts).toBe(0);
    expect(persisted.punchPinLockedUntil).toBeNull();
    expect(await bcrypt.compare('735194', persisted.punchPinHash ?? '')).toBe(
      true,
    );
  });

  it('writes a PUNCH_PIN audit log on set', async () => {
    const employee = await createEmployee(token);

    const before = await prisma.auditLog.count({
      where: { entity: 'PUNCH_PIN', entityId: employee.id },
    });

    const res = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/punch-pin`)
      .set('Authorization', `Bearer ${token}`)
      .send({ pin: '248193' });

    expect(res.status).toBe(200);

    const after = await prisma.auditLog.count({
      where: { entity: 'PUNCH_PIN', entityId: employee.id },
    });
    expect(after).toBe(before + 1);
  });
});
