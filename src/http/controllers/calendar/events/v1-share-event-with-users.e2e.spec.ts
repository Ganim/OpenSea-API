import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createCalendarEvent } from '@/utils/tests/factories/calendar/create-calendar-test-data.e2e';

describe('Share Event With Users (E2E)', () => {
  let tenantId: string;
  let ownerToken: string;
  let ownerId: string;
  let guestId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;

    const owner = await createAndAuthenticateUser(app, { tenantId });
    ownerToken = owner.token;
    ownerId = owner.user.user.id;

    const guest = await createAndAuthenticateUser(app, { tenantId });
    guestId = guest.user.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should share an event with specific users', async () => {
    const event = await createCalendarEvent(tenantId, ownerId);

    const response = await request(app.server)
      .post(`/v1/calendar/events/${event.id}/share-users`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ userIds: [guestId] });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('shared');
    expect(response.body.shared).toBe(1);
  });

  it('should return 404 for non-existent event', async () => {
    const fakeEventId = randomUUID();

    const response = await request(app.server)
      .post(`/v1/calendar/events/${fakeEventId}/share-users`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ userIds: [guestId] });

    expect(response.status).toBe(404);
  });

  it('should return 401 without token', async () => {
    const fakeEventId = randomUUID();

    const response = await request(app.server)
      .post(`/v1/calendar/events/${fakeEventId}/share-users`)
      .send({ userIds: [randomUUID()] });

    expect(response.status).toBe(401);
  });
});
