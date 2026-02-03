import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('List Comments (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list comments with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    // Create a customer
    const timestamp = Date.now();
    const customerResponse = await request(app.server)
      .post('/v1/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Customer ${timestamp}`,
        type: 'BUSINESS',
      });
    const customerId = customerResponse.body.customer.id;

    // Create a comment
    await request(app.server)
      .post('/v1/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        entityType: 'CUSTOMER',
        entityId: customerId,
        content: 'Test comment',
      });

    const response = await request(app.server)
      .get('/v1/comments')
      .query({
        entityType: 'CUSTOMER',
        entityId: customerId,
      })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('comments');
    expect(Array.isArray(response.body.comments)).toBe(true);
  });
});
