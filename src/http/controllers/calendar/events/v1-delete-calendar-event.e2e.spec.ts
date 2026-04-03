import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Delete Calendar Event (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should delete event', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    // Create an event
    const createResponse = await request(app.server)
      .post('/v1/calendar/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Evento Para Excluir',
        startDate: '2026-03-25T10:00:00.000Z',
        endDate: '2026-03-25T11:00:00.000Z',
      });

    expect(createResponse.status).toBe(201);
    const eventId = createResponse.body.event.id;

    // Delete the event
    const response = await request(app.server)
      .delete(`/v1/calendar/events/${eventId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });

  it('should return 404 for non-existent id', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const fakeId = randomUUID();

    const response = await request(app.server)
      .delete(`/v1/calendar/events/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('should reject deletion by non-creator', async () => {
    // User 1 creates the event
    const { token: token1 } = await createAndAuthenticateUser(app, {
      tenantId,
    });

    const createResponse = await request(app.server)
      .post('/v1/calendar/events')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        title: 'Evento do Usuário 1',
        startDate: '2026-03-26T10:00:00.000Z',
        endDate: '2026-03-26T11:00:00.000Z',
      });

    expect(createResponse.status).toBe(201);
    const eventId = createResponse.body.event.id;

    // User 2 tries to delete (has delete permission but NOT manage permission)
    const { token: token2 } = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: [
        'calendar.events.create',
        'calendar.events.read',
        'calendar.events.update',
        'calendar.events.delete',
        'calendar.events.list',
      ],
    });

    const response = await request(app.server)
      .delete(`/v1/calendar/events/${eventId}`)
      .set('Authorization', `Bearer ${token2}`);

    expect(response.status).toBe(400);
  });

  it('should return 401 without token', async () => {
    const fakeId = randomUUID();

    const response = await request(app.server).delete(
      `/v1/calendar/events/${fakeId}`,
    );

    expect(response.status).toBe(401);
  });

  it('should return 403 without permission', async () => {
    const { token } = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: [],
    });

    const fakeId = randomUUID();

    const response = await request(app.server)
      .delete(`/v1/calendar/events/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
  });
});
