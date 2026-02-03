import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Manufacturer (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create manufacturer with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/manufacturers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Manufacturer ${timestamp}`,
        country: 'United States',
        email: `manufacturer${timestamp}@example.com`,
        phone: '+1-555-0100',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('manufacturer');
    expect(response.body.manufacturer).toHaveProperty('id');
    expect(response.body.manufacturer).toHaveProperty('name');
  });
});
