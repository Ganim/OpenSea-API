import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Create HR Supplier (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create hr supplier with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/hr/suppliers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        legalName: `HR Supplier ${timestamp}`,
        cnpj: `${String(timestamp).slice(-14).padStart(14, '0')}`,
        email: `hrsupplier${timestamp}@example.com`,
        phoneMain: '11987654321',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('legalName');
    expect(response.body).toHaveProperty('type', 'SUPPLIER');
  });

  it('should not create hr supplier without auth token', async () => {
    const response = await request(app.server).post('/v1/hr/suppliers').send({
      legalName: 'Unauthorized Supplier',
    });

    expect(response.status).toBe(401);
  });
});
