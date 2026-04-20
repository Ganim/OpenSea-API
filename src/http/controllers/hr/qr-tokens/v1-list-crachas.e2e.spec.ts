import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { generateEmployeeData } from '@/utils/tests/factories/hr/create-employee.e2e';

async function createEmployee(
  token: string,
  overrides: { fullName?: string } = {},
) {
  const res = await request(app.server)
    .post('/v1/hr/employees')
    .set('Authorization', `Bearer ${token}`)
    .send({ ...generateEmployeeData(), ...overrides });
  return res.body.employee as { id: string; fullName: string };
}

async function rotateQr(token: string, employeeId: string) {
  const res = await request(app.server)
    .post(`/v1/hr/employees/${employeeId}/qr-token/rotate`)
    .set('Authorization', `Bearer ${token}`);
  return res;
}

describe('List Crachás (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const tenant = await createAndSetupTenant();
    tenantId = tenant.tenantId;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  it('returns 403 for user without hr.crachas.print permission', async () => {
    const unauthorized = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: [],
    });
    const res = await request(app.server)
      .get('/v1/hr/crachas')
      .set('Authorization', `Bearer ${unauthorized.token}`);
    expect(res.status).toBe(403);
  });

  it('returns tenant-scoped list with rotationStatus derived from qrTokenSetAt', async () => {
    // Seed: 3 employees — 1 recent (rotated now), 1 old (set 60d ago),
    // 1 never rotated.
    const recent = await createEmployee(token, { fullName: 'Alice Recent' });
    await rotateQr(token, recent.id);

    const old = await createEmployee(token, { fullName: 'Bob Old' });
    await rotateQr(token, old.id);
    await prisma.employee.update({
      where: { id: old.id },
      data: {
        qrTokenSetAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      } as never,
    });

    const never = await createEmployee(token, { fullName: 'Carol Never' });

    const res = await request(app.server)
      .get('/v1/hr/crachas')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(typeof res.body.total).toBe('number');
    expect(res.body.page).toBe(1);
    expect(Array.isArray(res.body.items)).toBe(true);

    const byId = new Map<string, { rotationStatus: string }>(
      (res.body.items as Array<{ id: string; rotationStatus: string }>).map(
        (i) => [i.id, i],
      ),
    );
    expect(byId.get(recent.id)?.rotationStatus).toBe('recent');
    expect(byId.get(old.id)?.rotationStatus).toBe('active');
    expect(byId.get(never.id)?.rotationStatus).toBe('never');
  });

  it('rotationStatus=never filter narrows to never-rotated employees', async () => {
    const res = await request(app.server)
      .get('/v1/hr/crachas?rotationStatus=never')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    for (const item of res.body.items) {
      expect(item.rotationStatus).toBe('never');
      expect(item.qrTokenSetAt).toBeNull();
    }
  });

  it('search filter matches by fullName (case-insensitive)', async () => {
    const target = await createEmployee(token, {
      fullName: `UniqueSearchTarget-${Date.now()}`,
    });

    const res = await request(app.server)
      .get(`/v1/hr/crachas?search=uniquesearchtarget`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const ids = (res.body.items as Array<{ id: string }>).map((i) => i.id);
    expect(ids).toContain(target.id);
  });

  it('pagination respects page + pageSize', async () => {
    const res = await request(app.server)
      .get('/v1/hr/crachas?pageSize=1&page=1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.page).toBe(1);
    expect(res.body.items.length).toBeLessThanOrEqual(1);
  });
});
