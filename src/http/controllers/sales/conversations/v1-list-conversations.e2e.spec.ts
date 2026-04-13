import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('List Conversations (E2E)', () => {
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
    const response = await request(app.server).get('/v1/sales/conversations');

    expect(response.status).toBe(401);
  });

  it('should list conversations (200)', async () => {
    const response = await request(app.server)
      .get('/v1/sales/conversations')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('conversations');
    expect(Array.isArray(response.body.conversations)).toBe(true);
  });

  it('should filter conversations by status', async () => {
    const response = await request(app.server)
      .get('/v1/sales/conversations?status=OPEN')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('conversations');
  });

  it('should support pagination', async () => {
    const response = await request(app.server)
      .get('/v1/sales/conversations?page=1&perPage=5')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('conversations');
    expect(response.body).toHaveProperty('total');
  });
});
