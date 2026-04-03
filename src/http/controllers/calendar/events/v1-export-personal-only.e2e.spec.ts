import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import {
  createCalendarEvent,
  ensurePersonalCalendar,
} from '@/utils/tests/factories/calendar/create-calendar-test-data.e2e';

describe('Export Calendar Events - Personal Only (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should export events as iCal', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });

    // Create an event so there's something to export
    await createCalendarEvent(tenantId, user.user.id, {
      startDate: new Date('2026-03-01T10:00:00.000Z'),
      endDate: new Date('2026-03-01T11:00:00.000Z'),
    });

    const response = await request(app.server)
      .get('/v1/calendar/events/export')
      .set('Authorization', `Bearer ${token}`)
      .query({
        startDate: '2026-03-01T00:00:00.000Z',
        endDate: '2026-03-31T23:59:59.000Z',
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/calendar');
    expect(response.headers['content-disposition']).toContain(
      'opensea-agenda.ics',
    );
    expect(response.text).toContain('BEGIN:VCALENDAR');
  });

  it('should export with calendarId filter (personal)', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });

    const calendarId = await ensurePersonalCalendar(tenantId, user.user.id);

    await createCalendarEvent(tenantId, user.user.id, {
      calendarId,
      startDate: new Date('2026-03-05T10:00:00.000Z'),
      endDate: new Date('2026-03-05T11:00:00.000Z'),
    });

    const response = await request(app.server)
      .get('/v1/calendar/events/export')
      .set('Authorization', `Bearer ${token}`)
      .query({
        startDate: '2026-03-01T00:00:00.000Z',
        endDate: '2026-03-31T23:59:59.000Z',
        calendarId,
      });

    expect(response.status).toBe(200);
    expect(response.text).toContain('BEGIN:VCALENDAR');
  });

  it('should reject date range exceeding 90 days', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/calendar/events/export')
      .set('Authorization', `Bearer ${token}`)
      .query({
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-06-01T00:00:00.000Z',
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .get('/v1/calendar/events/export')
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
      .get('/v1/calendar/events/export')
      .set('Authorization', `Bearer ${token}`)
      .query({
        startDate: '2026-03-01T00:00:00.000Z',
        endDate: '2026-03-31T23:59:59.000Z',
      });

    expect(response.status).toBe(403);
  });
});
