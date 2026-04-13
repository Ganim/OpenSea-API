import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Content (E2E)', () => {
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
      .post('/v1/content/generate')
      .send({ type: 'SOCIAL_POST' });

    expect(response.status).toBe(401);
  });

  it('should create generated content (201)', async () => {
    const response = await request(app.server)
      .post('/v1/content/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'SOCIAL_POST',
        channel: 'INSTAGRAM',
        title: `Content E2E ${Date.now()}`,
        caption: 'Test caption for generated content',
      });

    expect(response.status).toBe(201);
    expect(response.body.content).toBeDefined();
    expect(response.body.content).toHaveProperty('id');
  });
});
