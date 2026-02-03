import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Tag (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create tag with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/tags')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Featured Products ${timestamp}`,
        slug: `featured-products-${timestamp}`,
        color: '#FF5733',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('tag');
    expect(response.body.tag).toHaveProperty('id');
    expect(response.body.tag).toHaveProperty('name');
  });
});
