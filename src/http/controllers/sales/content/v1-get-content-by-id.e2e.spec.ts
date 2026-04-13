import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Get Content By ID (E2E)', () => {
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
    const response = await request(app.server).get(
      '/v1/content/00000000-0000-0000-0000-000000000001',
    );

    expect(response.status).toBe(401);
  });

  it('should get content by id (200)', async () => {
    const createRes = await request(app.server)
      .post('/v1/content/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'BANNER',
        title: `GetContent ${Date.now()}`,
      });

    const contentId = createRes.body.content.id;

    const response = await request(app.server)
      .get(`/v1/content/${contentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.content).toBeDefined();
    expect(response.body.content.id).toBe(contentId);
  });
});
