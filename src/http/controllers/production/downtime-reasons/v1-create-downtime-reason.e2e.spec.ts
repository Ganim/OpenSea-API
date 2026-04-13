import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Create Downtime Reason (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should create a downtime reason', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const ts = Date.now();

    const response = await request(app.server)
      .post('/v1/production/downtime-reasons')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: `DR-${ts}`,
        name: `Downtime Reason ${ts}`,
        category: 'MACHINE',
        isActive: true,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('downtimeReason');
    expect(response.body.downtimeReason).toHaveProperty('id');
    expect(response.body.downtimeReason.code).toBe(`DR-${ts}`);
    expect(response.body.downtimeReason.name).toBe(`Downtime Reason ${ts}`);
    expect(response.body.downtimeReason.category).toBe('MACHINE');
    expect(response.body.downtimeReason.isActive).toBe(true);
  });
});
