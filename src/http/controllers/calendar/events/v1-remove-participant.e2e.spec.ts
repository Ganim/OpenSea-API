import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import {
  createCalendarEvent,
  createEventParticipant,
} from '@/utils/tests/factories/calendar/create-calendar-test-data.e2e';

describe('Remove Participant (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should remove a participant from an event', async () => {
    const { token: ownerToken, user: ownerUser } =
      await createAndAuthenticateUser(app, { tenantId });
    const { user: guestUser } = await createAndAuthenticateUser(app, {
      tenantId,
    });

    const event = await createCalendarEvent(tenantId, ownerUser.user.id);

    // Invite user2 via API so participant record exists
    await request(app.server)
      .post(`/v1/calendar/events/${event.id}/participants`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        participants: [{ userId: guestUser.user.id }],
      });

    // Remove user2
    const response = await request(app.server)
      .delete(
        `/v1/calendar/events/${event.id}/participants/${guestUser.user.id}`,
      )
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('removed', true);
  });

  it('should reject removing the owner', async () => {
    const { token: ownerToken, user: ownerUser } =
      await createAndAuthenticateUser(app, { tenantId });

    const event = await createCalendarEvent(tenantId, ownerUser.user.id);

    // Try to remove the owner themselves
    const response = await request(app.server)
      .delete(
        `/v1/calendar/events/${event.id}/participants/${ownerUser.user.id}`,
      )
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  it('should reject removal by non-owner', async () => {
    const { user: ownerUser } = await createAndAuthenticateUser(app, {
      tenantId,
    });
    const { token: user2Token, user: user2 } = await createAndAuthenticateUser(
      app,
      { tenantId },
    );
    const { user: user3 } = await createAndAuthenticateUser(app, {
      tenantId,
    });

    const event = await createCalendarEvent(tenantId, ownerUser.user.id);

    // Add user2 and user3 as participants directly in DB
    await createEventParticipant(event.id, user2.user.id, tenantId);
    await createEventParticipant(event.id, user3.user.id, tenantId);

    // user2 (non-owner) tries to remove user3
    const response = await request(app.server)
      .delete(`/v1/calendar/events/${event.id}/participants/${user3.user.id}`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  }, 15000);

  it('should return 401 without token', async () => {
    const fakeEventId = randomUUID();
    const fakeUserId = randomUUID();

    const response = await request(app.server).delete(
      `/v1/calendar/events/${fakeEventId}/participants/${fakeUserId}`,
    );

    expect(response.status).toBe(401);
  });

  it('should return 403 without permission', async () => {
    const { token } = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: [],
    });
    const fakeEventId = randomUUID();
    const fakeUserId = randomUUID();

    const response = await request(app.server)
      .delete(`/v1/calendar/events/${fakeEventId}/participants/${fakeUserId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
  });
});
