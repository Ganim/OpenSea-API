import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Get Calendar Event (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should get event by id', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    // Create an event first
    const createResponse = await request(app.server)
      .post('/v1/calendar/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Evento Para Consulta',
        description: 'Descrição do evento de teste',
        startDate: '2026-03-15T09:00:00.000Z',
        endDate: '2026-03-15T10:00:00.000Z',
      });

    expect(createResponse.status).toBe(201);
    const eventId = createResponse.body.event.id;

    // GET by id
    const response = await request(app.server)
      .get(`/v1/calendar/events/${eventId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('event');
    expect(response.body.event.id).toBe(eventId);
    expect(response.body.event.title).toBe('Evento Para Consulta');
    expect(response.body.event.description).toBe(
      'Descrição do evento de teste',
    );
  });

  it('should return 404 for non-existent id', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const fakeId = randomUUID();

    const response = await request(app.server)
      .get(`/v1/calendar/events/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('should mask private events for non-participants', async () => {
    // User 1 creates a PRIVATE event
    const { token: token1 } = await createAndAuthenticateUser(app, {
      tenantId,
    });

    const createResponse = await request(app.server)
      .post('/v1/calendar/events')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        title: 'Evento Confidencial',
        description: 'Informação sensível',
        location: 'Sala Secreta',
        startDate: '2026-03-20T14:00:00.000Z',
        endDate: '2026-03-20T15:00:00.000Z',
        visibility: 'PRIVATE',
      });

    expect(createResponse.status).toBe(201);
    const eventId = createResponse.body.event.id;

    // User 2 tries to GET the private event
    const { token: token2 } = await createAndAuthenticateUser(app, {
      tenantId,
    });

    const response = await request(app.server)
      .get(`/v1/calendar/events/${eventId}`)
      .set('Authorization', `Bearer ${token2}`);

    expect(response.status).toBe(200);
    expect(response.body.event.title).toBe('Ocupado');
    expect(response.body.event.description).toBeNull();
    expect(response.body.event.location).toBeNull();
  });

  it('should return 401 without token', async () => {
    const fakeId = randomUUID();

    const response = await request(app.server).get(
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
      .get(`/v1/calendar/events/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
  });
});
