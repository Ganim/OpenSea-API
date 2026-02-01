import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Get HR Supplier By ID (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get hr supplier by id with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now();

    // Create supplier via API
    const createResponse = await request(app.server)
      .post('/v1/hr/suppliers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        legalName: `Test HR Supplier ${timestamp}`,
        cnpj: `${String(timestamp).slice(-14).padStart(14, '0')}`,
      });

    const supplierId = createResponse.body.id;

    const response = await request(app.server)
      .get(`/v1/hr/suppliers/${supplierId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', supplierId);
    expect(response.body).toHaveProperty('legalName');
    expect(response.body).toHaveProperty('type', 'SUPPLIER');
  });

  it('should not get hr supplier without auth token', async () => {
    const response = await request(app.server).get(
      '/v1/hr/suppliers/00000000-0000-0000-0000-000000000000',
    );

    expect(response.status).toBe(401);
  });
});
