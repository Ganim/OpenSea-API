import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Calendar Event (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create event with minimal fields', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/calendar/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Reunião de Planejamento',
        startDate: '2026-03-01T10:00:00.000Z',
        endDate: '2026-03-01T11:00:00.000Z',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('event');
    expect(response.body.event).toHaveProperty('id');
    expect(response.body.event.title).toBe('Reunião de Planejamento');
    expect(response.body.event.type).toBe('CUSTOM');
    expect(response.body.event.visibility).toBe('PUBLIC');
  });

  it('should create event with all fields', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/calendar/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Reunião Semanal de Equipe',
        description: 'Reunião semanal para alinhamento do time',
        location: 'Sala de Conferência B',
        startDate: '2026-03-02T14:00:00.000Z',
        endDate: '2026-03-02T15:30:00.000Z',
        type: 'MEETING',
        visibility: 'PRIVATE',
        color: '#3b82f6',
        timezone: 'America/Sao_Paulo',
        rrule: 'FREQ=WEEKLY;BYDAY=MO',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('event');
    expect(response.body.event.title).toBe('Reunião Semanal de Equipe');
    expect(response.body.event.description).toBe(
      'Reunião semanal para alinhamento do time',
    );
    expect(response.body.event.location).toBe('Sala de Conferência B');
    expect(response.body.event.type).toBe('MEETING');
    expect(response.body.event.visibility).toBe('PRIVATE');
    expect(response.body.event.color).toBe('#3b82f6');
    expect(response.body.event.timezone).toBe('America/Sao_Paulo');
    expect(response.body.event.rrule).toBe('FREQ=WEEKLY;BYDAY=MO');
  });

  it('should reject empty title', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/calendar/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: '',
        startDate: '2026-03-01T10:00:00.000Z',
        endDate: '2026-03-01T11:00:00.000Z',
      });

    expect(response.status).toBe(400);
  });

  it('should reject endDate before startDate', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/calendar/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Evento Inválido',
        startDate: '2026-03-01T15:00:00.000Z',
        endDate: '2026-03-01T10:00:00.000Z',
      });

    expect(response.status).toBe(400);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/calendar/events')
      .send({
        title: 'Evento Sem Auth',
        startDate: '2026-03-01T10:00:00.000Z',
        endDate: '2026-03-01T11:00:00.000Z',
      });

    expect(response.status).toBe(401);
  });

  it('should return 403 without permission', async () => {
    const { token } = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: [],
    });

    const response = await request(app.server)
      .post('/v1/calendar/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Evento Sem Permissão',
        startDate: '2026-03-01T10:00:00.000Z',
        endDate: '2026-03-01T11:00:00.000Z',
      });

    expect(response.status).toBe(403);
  });
});
