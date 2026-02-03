import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Supplier (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create supplier with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/suppliers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Supplier ${timestamp}`,
        email: `supplier${timestamp}@example.com`,
        phone: '(11) 98765-4321',
        city: 'São Paulo',
        state: 'SP',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('supplier');
    expect(response.body.supplier).toHaveProperty('id');
    expect(response.body.supplier).toHaveProperty('name');
  });
});
