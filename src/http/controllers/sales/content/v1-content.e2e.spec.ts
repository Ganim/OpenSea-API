import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Content (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /v1/content/generate should create content (201)', async () => {
    const response = await request(app.server)
      .post('/v1/content/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'SOCIAL_POST',
        channel: 'INSTAGRAM',
        title: `Content E2E ${Date.now()}`,
        caption: 'Test caption for E2E test',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('content');
    expect(response.body.content).toHaveProperty('id');
    expect(response.body.content.type).toBe('SOCIAL_POST');
    expect(response.body.content.channel).toBe('INSTAGRAM');
  });

  it('GET /v1/content should list contents (200)', async () => {
    const response = await request(app.server)
      .get('/v1/content')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('DELETE /v1/content/:id should delete content (204)', async () => {
    const createResponse = await request(app.server)
      .post('/v1/content/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'BANNER',
        title: `Content Delete ${Date.now()}`,
      });

    const contentId = createResponse.body.content.id;

    const response = await request(app.server)
      .delete(`/v1/content/${contentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });
});
