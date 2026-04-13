import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Activity (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/activities')
      .send({ type: 'NOTE', title: 'Test' });

    expect(response.status).toBe(401);
  });

  it('should create an activity (201)', async () => {
    const response = await request(app.server)
      .post('/v1/activities')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'NOTE',
        title: `Activity E2E ${Date.now()}`,
        description: 'Test activity description',
      });

    expect(response.status).toBe(201);
    expect(response.body.activity).toBeDefined();
    expect(response.body.activity).toHaveProperty('id');
    expect(response.body.activity.type).toBe('NOTE');
  });
});
