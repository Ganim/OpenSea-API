import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Delete Comment (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should delete comment with correct schema', async () => {
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
    const commentResponse = await request(app.server)
      .post('/v1/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        entityType: 'CUSTOMER',
        entityId: customerId,
        content: 'Comment to be deleted',
      });
    const commentId = commentResponse.body.comment.id;

    // Delete the comment
    const response = await request(app.server)
      .delete(`/v1/comments/${commentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });
});
