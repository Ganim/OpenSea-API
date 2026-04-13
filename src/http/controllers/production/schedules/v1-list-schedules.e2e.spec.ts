import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('List Schedules (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;

    await prisma.productionSchedule.create({
      data: {
        tenantId,
        name: `Schedule ${Date.now()}`,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 86400000),
      },
    });
  });

  it('should list production schedules', async () => {
    const response = await request(app.server)
      .get('/v1/production/schedules')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('schedules');
    expect(Array.isArray(response.body.schedules)).toBe(true);
    expect(response.body.schedules.length).toBeGreaterThanOrEqual(1);
  });
});
