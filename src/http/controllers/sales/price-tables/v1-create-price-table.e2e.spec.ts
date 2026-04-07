import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Price Table (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should create a price table', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/price-tables')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Price Table ${timestamp}`,
        type: 'RETAIL',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('priceTable');
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/price-tables')
      .send({ name: 'No Auth', type: 'RETAIL' });

    expect(response.status).toBe(401);
  });
});
