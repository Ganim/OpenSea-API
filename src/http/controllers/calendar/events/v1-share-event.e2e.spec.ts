import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createCalendarEvent } from '@/utils/tests/factories/calendar/create-calendar-test-data.e2e';

describe('Share / Unshare Event (E2E)', () => {
  let tenantId: string;
  let ownerToken: string;
  let ownerId: string;
  let guestToken: string;
  let guestId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;

    // Create two shared users for all tests to avoid rate limiting
    const owner = await createAndAuthenticateUser(app, { tenantId });
    ownerToken = owner.token;
    ownerId = owner.user.user.id;

    const guest = await createAndAuthenticateUser(app, { tenantId });
    guestToken = guest.token;
    guestId = guest.user.user.id;
  });


  it('should share event with a user', async () => {
    const event = await createCalendarEvent(tenantId, ownerId);

    const response = await request(app.server)
      .post(`/v1/calendar/events/${event.id}/share-users`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ userIds: [guestId] });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('shared', 1);
  });

  it('should skip already shared user', async () => {
    const event = await createCalendarEvent(tenantId, ownerId);

    // First share
    await request(app.server)
      .post(`/v1/calendar/events/${event.id}/share-users`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ userIds: [guestId] });

    // Second share — should skip
    const response = await request(app.server)
      .post(`/v1/calendar/events/${event.id}/share-users`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ userIds: [guestId] });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('shared', 0);
  });

  it('should unshare event (remove shared user)', async () => {
    const event = await createCalendarEvent(tenantId, ownerId);

    // Share first
    await request(app.server)
      .post(`/v1/calendar/events/${event.id}/share-users`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ userIds: [guestId] });

    // Unshare
    const response = await request(app.server)
      .delete(`/v1/calendar/events/${event.id}/share-users/${guestId}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('removed', true);
  });

  it('should reject unshare by non-owner', async () => {
    const event = await createCalendarEvent(tenantId, ownerId);

    // Guest tries to unshare someone — should fail (not the owner)
    const response = await request(app.server)
      .delete(`/v1/calendar/events/${event.id}/share-users/${ownerId}`)
      .set('Authorization', `Bearer ${guestToken}`);

    expect(response.status).toBe(403);
  });

  it('should return 404 for non-existent event on share', async () => {
    const fakeEventId = randomUUID();

    const response = await request(app.server)
      .post(`/v1/calendar/events/${fakeEventId}/share-users`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ userIds: [randomUUID()] });

    expect(response.status).toBe(404);
  });

  it('should return 404 for non-existent event on unshare', async () => {
    const fakeEventId = randomUUID();
    const fakeUserId = randomUUID();

    const response = await request(app.server)
      .delete(`/v1/calendar/events/${fakeEventId}/share-users/${fakeUserId}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(response.status).toBe(404);
  });

  it('should return 401 without token', async () => {
    const fakeEventId = randomUUID();

    const response = await request(app.server)
      .post(`/v1/calendar/events/${fakeEventId}/share-users`)
      .send({ userIds: [randomUUID()] });

    expect(response.status).toBe(401);
  });

  it('should return 403 without permission', async () => {
    const { token: noPermToken } = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: [],
    });
    const fakeEventId = randomUUID();

    const response = await request(app.server)
      .post(`/v1/calendar/events/${fakeEventId}/share-users`)
      .set('Authorization', `Bearer ${noPermToken}`)
      .send({ userIds: [randomUUID()] });

    expect(response.status).toBe(403);
  });
});
