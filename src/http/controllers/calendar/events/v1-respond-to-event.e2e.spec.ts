import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createCalendarEvent } from '@/utils/tests/factories/calendar/create-calendar-test-data.e2e';

describe('Respond to Event (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should accept an event invitation', async () => {
    const { token: ownerToken, user: ownerUser } =
      await createAndAuthenticateUser(app, { tenantId });
    const { token: guestToken, user: guestUser } =
      await createAndAuthenticateUser(app, { tenantId });

    const event = await createCalendarEvent(tenantId, ownerUser.user.id);

    // Invite user2 via API
    await request(app.server)
      .post(`/v1/calendar/events/${event.id}/participants`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        participants: [{ userId: guestUser.user.id }],
      });

    // Respond as ACCEPTED
    const response = await request(app.server)
      .patch(`/v1/calendar/events/${event.id}/respond`)
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ status: 'ACCEPTED' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('participantId');
    expect(response.body).toHaveProperty('status', 'ACCEPTED');
  });

  it('should decline an event invitation', async () => {
    const { token: ownerToken, user: ownerUser } =
      await createAndAuthenticateUser(app, { tenantId });
    const { token: guestToken, user: guestUser } =
      await createAndAuthenticateUser(app, { tenantId });

    const event = await createCalendarEvent(tenantId, ownerUser.user.id);

    // Invite user2 via API
    await request(app.server)
      .post(`/v1/calendar/events/${event.id}/participants`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        participants: [{ userId: guestUser.user.id }],
      });

    // Respond as DECLINED
    const response = await request(app.server)
      .patch(`/v1/calendar/events/${event.id}/respond`)
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ status: 'DECLINED' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('participantId');
    expect(response.body).toHaveProperty('status', 'DECLINED');
  });

  it('should reject owner responding to own event', async () => {
    const { token: ownerToken, user: ownerUser } =
      await createAndAuthenticateUser(app, { tenantId });

    const event = await createCalendarEvent(tenantId, ownerUser.user.id);

    const response = await request(app.server)
      .patch(`/v1/calendar/events/${event.id}/respond`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'ACCEPTED' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  it('should reject non-participant responding', async () => {
    const { user: ownerUser } = await createAndAuthenticateUser(app, {
      tenantId,
    });
    const { token: outsiderToken } = await createAndAuthenticateUser(app, {
      tenantId,
    });

    const event = await createCalendarEvent(tenantId, ownerUser.user.id);

    const response = await request(app.server)
      .patch(`/v1/calendar/events/${event.id}/respond`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send({ status: 'ACCEPTED' });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 401 without token', async () => {
    const fakeEventId = randomUUID();

    const response = await request(app.server)
      .patch(`/v1/calendar/events/${fakeEventId}/respond`)
      .send({ status: 'ACCEPTED' });

    expect(response.status).toBe(401);
  });

  it('should return 403 without permission', async () => {
    const { token } = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: [],
    });
    const fakeEventId = randomUUID();

    const response = await request(app.server)
      .patch(`/v1/calendar/events/${fakeEventId}/respond`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'ACCEPTED' });

    expect(response.status).toBe(403);
  });
});
