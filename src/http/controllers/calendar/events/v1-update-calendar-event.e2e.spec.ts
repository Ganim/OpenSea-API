import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Update Calendar Event (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should update event', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    // Create an event
    const createResponse = await request(app.server)
      .post('/v1/calendar/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Título Original',
        startDate: '2026-03-10T10:00:00.000Z',
        endDate: '2026-03-10T11:00:00.000Z',
      });

    expect(createResponse.status).toBe(201);
    const eventId = createResponse.body.event.id;

    // Update title
    const response = await request(app.server)
      .patch(`/v1/calendar/events/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Título Atualizado',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('event');
    expect(response.body.event.id).toBe(eventId);
    expect(response.body.event.title).toBe('Título Atualizado');
  });

  it('should update timezone', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    // Create an event
    const createResponse = await request(app.server)
      .post('/v1/calendar/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Evento Fuso Horário',
        startDate: '2026-03-12T08:00:00.000Z',
        endDate: '2026-03-12T09:00:00.000Z',
      });

    expect(createResponse.status).toBe(201);
    const eventId = createResponse.body.event.id;

    // Update timezone
    const response = await request(app.server)
      .patch(`/v1/calendar/events/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        timezone: 'America/Sao_Paulo',
      });

    expect(response.status).toBe(200);
    expect(response.body.event.timezone).toBe('America/Sao_Paulo');
  });

  it('should return 404 for non-existent id', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const fakeId = randomUUID();

    const response = await request(app.server)
      .patch(`/v1/calendar/events/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Não Existe',
      });

    expect(response.status).toBe(404);
  });

  it('should reject update by non-creator', async () => {
    // User 1 creates the event
    const { token: token1 } = await createAndAuthenticateUser(app, {
      tenantId,
    });

    const createResponse = await request(app.server)
      .post('/v1/calendar/events')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        title: 'Evento do Usuário 1',
        startDate: '2026-03-18T10:00:00.000Z',
        endDate: '2026-03-18T11:00:00.000Z',
      });

    expect(createResponse.status).toBe(201);
    const eventId = createResponse.body.event.id;

    // User 2 tries to update
    const { token: token2 } = await createAndAuthenticateUser(app, {
      tenantId,
    });

    const response = await request(app.server)
      .patch(`/v1/calendar/events/${eventId}`)
      .set('Authorization', `Bearer ${token2}`)
      .send({
        title: 'Tentativa de Alteração',
      });

    expect(response.status).toBe(400);
  });

  it('should return 401 without token', async () => {
    const fakeId = randomUUID();

    const response = await request(app.server)
      .patch(`/v1/calendar/events/${fakeId}`)
      .send({
        title: 'Sem Auth',
      });

    expect(response.status).toBe(401);
  });

  it('should return 403 without permission', async () => {
    const { token } = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: [],
    });

    const fakeId = randomUUID();

    const response = await request(app.server)
      .patch(`/v1/calendar/events/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Sem Permissão',
      });

    expect(response.status).toBe(403);
  });
});
