import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('List Calendars (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it("should list user's personal calendar", async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/calendar/calendars')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('calendars');
    expect(Array.isArray(response.body.calendars)).toBe(true);
    expect(response.body.calendars.length).toBeGreaterThanOrEqual(1);
  });

  it('should auto-create personal calendar if not exists', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    // First request should auto-create the personal calendar
    const response = await request(app.server)
      .get('/v1/calendar/calendars')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('calendars');

    const personalCalendars = response.body.calendars.filter(
      (c: Record<string, unknown>) => c.type === 'PERSONAL',
    );
    expect(personalCalendars.length).toBeGreaterThanOrEqual(1);

    const personal = personalCalendars[0];
    expect(personal).toHaveProperty('id');
    expect(personal).toHaveProperty('name');
    expect(personal.isDefault).toBe(true);
  });

  it('should require authentication', async () => {
    const response = await request(app.server).get('/v1/calendar/calendars');

    expect(response.status).toBe(401);
  });
});
