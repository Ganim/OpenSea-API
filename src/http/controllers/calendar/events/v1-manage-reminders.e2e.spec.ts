import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createCalendarEvent } from '@/utils/tests/factories/calendar/create-calendar-test-data.e2e';

describe('Manage Reminders (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should set reminders for an event', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });

    const event = await createCalendarEvent(tenantId, user.user.id);

    const response = await request(app.server)
      .put(`/v1/calendar/events/${event.id}/reminders`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        reminders: [{ minutesBefore: 15 }, { minutesBefore: 60 }],
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('count', 2);
  });

  it('should clear reminders with empty array', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });

    const event = await createCalendarEvent(tenantId, user.user.id);

    // Set reminders first
    await request(app.server)
      .put(`/v1/calendar/events/${event.id}/reminders`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        reminders: [{ minutesBefore: 30 }],
      });

    // Clear reminders
    const response = await request(app.server)
      .put(`/v1/calendar/events/${event.id}/reminders`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        reminders: [],
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('count', 0);
  });

  it('should reject non-participant managing reminders', async () => {
    const { user: ownerUser } = await createAndAuthenticateUser(app, {
      tenantId,
    });
    const { token: outsiderToken } = await createAndAuthenticateUser(app, {
      tenantId,
    });

    const event = await createCalendarEvent(tenantId, ownerUser.user.id);

    const response = await request(app.server)
      .put(`/v1/calendar/events/${event.id}/reminders`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send({
        reminders: [{ minutesBefore: 10 }],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 401 without token', async () => {
    const fakeEventId = randomUUID();

    const response = await request(app.server)
      .put(`/v1/calendar/events/${fakeEventId}/reminders`)
      .send({
        reminders: [{ minutesBefore: 10 }],
      });

    expect(response.status).toBe(401);
  });

  it('should return 403 without permission', async () => {
    const { token } = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: [],
    });
    const fakeEventId = randomUUID();

    const response = await request(app.server)
      .put(`/v1/calendar/events/${fakeEventId}/reminders`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        reminders: [{ minutesBefore: 10 }],
      });

    expect(response.status).toBe(403);
  });
});
