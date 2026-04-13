import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Update Schedule Entry (E2E)', () => {
  let tenantId: string;
  let token: string;
  let scheduleId: string;
  let entryId: string;

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

    const entry = await prisma.productionScheduleEntry.create({
      data: {
        scheduleId,
        title: `Entry ${Date.now()}`,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
      },
    });
    entryId = entry.id;
  });

  it('should update a schedule entry', async () => {
    const newTitle = `Updated Entry ${Date.now()}`;
    const response = await request(app.server)
      .put(`/v1/production/schedules/${scheduleId}/entries/${entryId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: newTitle,
        status: 'CONFIRMED',
        color: '#00FF00',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('entry');
    expect(response.body.entry.id).toBe(entryId);
    expect(response.body.entry.title).toBe(newTitle);
    expect(response.body.entry.status).toBe('CONFIRMED');
  });
});
