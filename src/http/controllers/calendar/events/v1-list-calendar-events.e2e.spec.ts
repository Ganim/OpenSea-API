import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('List Calendar Events (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should list events with meta', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    // Create 2 events via POST
    await request(app.server)
      .post('/v1/calendar/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Evento Lista 1',
        startDate: '2026-04-10T09:00:00.000Z',
        endDate: '2026-04-10T10:00:00.000Z',
      });

    await request(app.server)
      .post('/v1/calendar/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Evento Lista 2',
        startDate: '2026-04-11T14:00:00.000Z',
        endDate: '2026-04-11T15:00:00.000Z',
      });

    const response = await request(app.server)
      .get('/v1/calendar/events')
      .query({
        startDate: '2026-04-01T00:00:00.000Z',
        endDate: '2026-04-30T23:59:59.000Z',
      })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('events');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.events)).toBe(true);
    expect(response.body.events.length).toBeGreaterThanOrEqual(2);
    expect(response.body.meta).toHaveProperty('total');
    expect(response.body.meta).toHaveProperty('page');
    expect(response.body.meta).toHaveProperty('limit');
    expect(response.body.meta).toHaveProperty('pages');
  });

  it('should filter by type', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    // Create a MEETING event
    await request(app.server)
      .post('/v1/calendar/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Reunião de Alinhamento',
        startDate: '2026-05-05T10:00:00.000Z',
        endDate: '2026-05-05T11:00:00.000Z',
        type: 'MEETING',
      });

    // Create a TASK event
    await request(app.server)
      .post('/v1/calendar/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Tarefa de Revisão',
        startDate: '2026-05-06T10:00:00.000Z',
        endDate: '2026-05-06T11:00:00.000Z',
        type: 'TASK',
      });

    // Filter by MEETING
    const response = await request(app.server)
      .get('/v1/calendar/events')
      .query({
        startDate: '2026-05-01T00:00:00.000Z',
        endDate: '2026-05-31T23:59:59.000Z',
        type: 'MEETING',
      })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.events.length).toBeGreaterThanOrEqual(1);

    for (const event of response.body.events) {
      expect(event.type).toBe('MEETING');
    }
  });

  it('should return holidays in range', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    // Query January 2026 - should contain "Confraternização Universal" (Jan 1)
    const response = await request(app.server)
      .get('/v1/calendar/events')
      .query({
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-01-31T23:59:59.000Z',
      })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);

    const holidays = response.body.events.filter(
      (e: Record<string, unknown>) => e.type === 'HOLIDAY',
    );
    expect(holidays.length).toBeGreaterThanOrEqual(1);

    const confraternizacao = holidays.find(
      (h: Record<string, unknown>) => h.title === 'Confraternização Universal',
    );
    expect(confraternizacao).toBeDefined();
  });

  it('should reject missing dates', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/calendar/events')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
  });

  it('should reject range greater than 90 days', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/calendar/events')
      .query({
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-06-01T00:00:00.000Z',
      })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .get('/v1/calendar/events')
      .query({
        startDate: '2026-03-01T00:00:00.000Z',
        endDate: '2026-03-31T23:59:59.000Z',
      });

    expect(response.status).toBe(401);
  });

  it('should return 403 without permission', async () => {
    const { token } = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: [],
    });

    const response = await request(app.server)
      .get('/v1/calendar/events')
      .query({
        startDate: '2026-03-01T00:00:00.000Z',
        endDate: '2026-03-31T23:59:59.000Z',
      })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
  });
});
