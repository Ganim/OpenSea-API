import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Finance Category (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a finance category', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/finance/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'E2E Category',
        type: 'EXPENSE',
      });

    expect(response.status).toBe(201);
    expect(response.body.category).toEqual(
      expect.objectContaining({
        name: 'E2E Category',
        type: 'EXPENSE',
      }),
    );
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).post('/v1/finance/categories');

    expect(response.status).toBe(401);
  });
});
