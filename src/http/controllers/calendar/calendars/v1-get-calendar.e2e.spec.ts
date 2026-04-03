import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { ensurePersonalCalendar } from '@/utils/tests/factories/calendar/create-calendar-test-data.e2e';

describe('Get Calendar (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should get calendar by id', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const calendarId = await ensurePersonalCalendar(tenantId, userId);

    const response = await request(app.server)
      .get(`/v1/calendar/calendars/${calendarId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('calendar');
    expect(response.body.calendar.id).toBe(calendarId);
    expect(response.body.calendar).toHaveProperty('name');
    expect(response.body.calendar).toHaveProperty('type');
    expect(response.body.calendar).toHaveProperty('isDefault');
    expect(response.body.calendar).toHaveProperty('access');
  });

  it('should return 404 for non-existent calendar', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const fakeId = randomUUID();

    const response = await request(app.server)
      .get(`/v1/calendar/calendars/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('should require authentication', async () => {
    const fakeId = randomUUID();

    const response = await request(app.server).get(
      `/v1/calendar/calendars/${fakeId}`,
    );

    expect(response.status).toBe(401);
  });
});
