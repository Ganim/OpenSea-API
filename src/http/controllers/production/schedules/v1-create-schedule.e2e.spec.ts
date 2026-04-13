import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Create Schedule (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  it('should create a production schedule', async () => {
    const ts = Date.now();
    const response = await request(app.server)
      .post('/v1/production/schedules')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Schedule ${ts}`,
        description: 'Test production schedule',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('schedule');
    expect(response.body.schedule).toHaveProperty('id');
    expect(response.body.schedule.name).toBe(`Schedule ${ts}`);
    expect(response.body.schedule.isActive).toBe(true);
  });
});
