import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Timeline (E2E)', () => {
  let tenantId: string;
  let token: string;
  let customerId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;

    // Create a customer to use as entity filter
    const timestamp = Date.now();
    const customerResponse = await request(app.server)
      .post('/v1/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Timeline Test Customer ${timestamp}`,
        type: 'BUSINESS',
        email: `timeline-${timestamp}@example.com`,
      });
    customerId = customerResponse.body.customer.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /v1/timeline should return timeline items filtered by customerId (200)', async () => {
    const response = await request(app.server)
      .get('/v1/timeline')
      .query({ customerId })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('items');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.meta).toHaveProperty('total');
    expect(response.body.meta).toHaveProperty('page');
    expect(response.body.meta).toHaveProperty('limit');
    expect(response.body.meta).toHaveProperty('totalPages');
  });

  it('GET /v1/timeline should return 400 without any entity filter', async () => {
    const response = await request(app.server)
      .get('/v1/timeline')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  });
});
