import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Export Calendar Events (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should export events as .ics file', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    // Create an event first
    await request(app.server)
      .post('/v1/calendar/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Reunião de Exportação',
        startDate: '2026-06-10T09:00:00.000Z',
        endDate: '2026-06-10T10:00:00.000Z',
        type: 'MEETING',
      });

    const response = await request(app.server)
      .get('/v1/calendar/events/export')
      .query({
        startDate: '2026-06-01T00:00:00.000Z',
        endDate: '2026-06-30T23:59:59.000Z',
      })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/calendar');
    expect(response.headers['content-disposition']).toContain(
      'opensea-agenda.ics',
    );
    expect(response.text).toContain('BEGIN:VCALENDAR');
    expect(response.text).toContain('END:VCALENDAR');
    expect(response.text).toContain('Reunião de Exportação');
  });

  it('should return empty calendar when no events in range', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/calendar/events/export')
      .query({
        startDate: '2027-01-01T00:00:00.000Z',
        endDate: '2027-01-31T23:59:59.000Z',
      })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.text).toContain('BEGIN:VCALENDAR');
    expect(response.text).toContain('END:VCALENDAR');
    expect(response.text).not.toContain('BEGIN:VEVENT');
  });

  it('should filter by event type', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    await request(app.server)
      .post('/v1/calendar/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Tarefa Export',
        startDate: '2026-07-05T10:00:00.000Z',
        endDate: '2026-07-05T11:00:00.000Z',
        type: 'TASK',
      });

    await request(app.server)
      .post('/v1/calendar/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Reunião Export',
        startDate: '2026-07-06T10:00:00.000Z',
        endDate: '2026-07-06T11:00:00.000Z',
        type: 'MEETING',
      });

    const response = await request(app.server)
      .get('/v1/calendar/events/export')
      .query({
        startDate: '2026-07-01T00:00:00.000Z',
        endDate: '2026-07-31T23:59:59.000Z',
        type: 'TASK',
      })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.text).toContain('Tarefa Export');
    expect(response.text).not.toContain('Reunião Export');
  });

  it('should include RRULE for recurring events', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    await request(app.server)
      .post('/v1/calendar/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Standup Diário',
        startDate: '2026-08-03T09:00:00.000Z',
        endDate: '2026-08-03T09:15:00.000Z',
        rrule: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
      });

    const response = await request(app.server)
      .get('/v1/calendar/events/export')
      .query({
        startDate: '2026-08-01T00:00:00.000Z',
        endDate: '2026-08-31T23:59:59.000Z',
      })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.text).toContain('Standup Diário');
    expect(response.text).toContain('RRULE:FREQ=WEEKLY');
  });

  it('should reject range greater than 90 days', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/calendar/events/export')
      .query({
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-06-01T00:00:00.000Z',
      })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .get('/v1/calendar/events/export')
      .query({
        startDate: '2026-06-01T00:00:00.000Z',
        endDate: '2026-06-30T23:59:59.000Z',
      });

    expect(response.status).toBe(401);
  });

  it('should return 403 without permission', async () => {
    const { token } = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: [],
    });

    const response = await request(app.server)
      .get('/v1/calendar/events/export')
      .query({
        startDate: '2026-06-01T00:00:00.000Z',
        endDate: '2026-06-30T23:59:59.000Z',
      })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
  });
});
