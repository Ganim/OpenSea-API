import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Create Schedule Entry (E2E)', () => {
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

  it('should create a schedule entry', async () => {
    const ts = Date.now();
    const response = await request(app.server)
      .post(`/v1/production/schedules/${scheduleId}/entries`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: `Entry ${ts}`,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        color: '#FF5733',
        notes: 'Test schedule entry',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('entry');
    expect(response.body.entry).toHaveProperty('id');
    expect(response.body.entry.title).toBe(`Entry ${ts}`);
    expect(response.body.entry.scheduleId).toBe(scheduleId);
    expect(response.body.entry.status).toBe('PLANNED');
  });
});
