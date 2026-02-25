import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createCalendarEvent } from '@/utils/tests/factories/calendar/create-calendar-test-data.e2e';

describe('Invite Participants (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should invite a participant to an event', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const { token: token2, user: user2 } = await createAndAuthenticateUser(
      app,
      { tenantId },
    );

    const event = await createCalendarEvent(tenantId, user.user.id);

    const response = await request(app.server)
      .post(`/v1/calendar/events/${event.id}/participants`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        participants: [{ userId: user2.user.id }],
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('invited', 1);
  });

  it('should skip duplicate participant', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const { user: user2 } = await createAndAuthenticateUser(app, { tenantId });

    const event = await createCalendarEvent(tenantId, user.user.id);

    // First invite
    await request(app.server)
      .post(`/v1/calendar/events/${event.id}/participants`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        participants: [{ userId: user2.user.id }],
      });

    // Second invite of the same user
    const response = await request(app.server)
      .post(`/v1/calendar/events/${event.id}/participants`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        participants: [{ userId: user2.user.id }],
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('invited', 0);
  });

  it(
    'should reject invite by non-owner',
    async () => {
      const { user: user1 } = await createAndAuthenticateUser(app, {
        tenantId,
      });
      const { token: token2, user: user2 } =
        await createAndAuthenticateUser(app, { tenantId });
      const { user: user3 } = await createAndAuthenticateUser(app, {
        tenantId,
      });

      const event = await createCalendarEvent(tenantId, user1.user.id);

      const response = await request(app.server)
        .post(`/v1/calendar/events/${event.id}/participants`)
        .set('Authorization', `Bearer ${token2}`)
        .send({
          participants: [{ userId: user3.user.id }],
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    },
    15000,
  );

  it('should return 404 for non-existent event', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const fakeEventId = randomUUID();

    const response = await request(app.server)
      .post(`/v1/calendar/events/${fakeEventId}/participants`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        participants: [{ userId: randomUUID() }],
      });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 401 without token', async () => {
    const fakeEventId = randomUUID();

    const response = await request(app.server)
      .post(`/v1/calendar/events/${fakeEventId}/participants`)
      .send({
        participants: [{ userId: randomUUID() }],
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
      .post(`/v1/calendar/events/${fakeEventId}/participants`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        participants: [{ userId: randomUUID() }],
      });

    expect(response.status).toBe(403);
  });
});
