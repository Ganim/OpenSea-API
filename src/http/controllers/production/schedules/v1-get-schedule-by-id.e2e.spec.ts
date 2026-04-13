import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Get Schedule By ID (E2E)', () => {
  let tenantId: string;
  let token: string;
  let scheduleId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;

    const schedule = await prisma.productionSchedule.create({
      data: {
        tenantId,
        name: `Schedule ${Date.now()}`,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 86400000),
      },
    });
    scheduleId = schedule.id;
  });

  it('should get a schedule by ID', async () => {
    const response = await request(app.server)
      .get(`/v1/production/schedules/${scheduleId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('schedule');
    expect(response.body.schedule.id).toBe(scheduleId);
    expect(response.body.schedule).toHaveProperty('name');
    expect(response.body.schedule).toHaveProperty('startDate');
    expect(response.body.schedule).toHaveProperty('endDate');
  });
});
