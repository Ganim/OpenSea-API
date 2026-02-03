import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createRequestE2E } from '@/utils/tests/factories/core/create-request.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Add Request Comment (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should add comment with correct schema', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });

    const testRequest = await createRequestE2E({
      targetId: user.user.id,
      requesterId: user.user.id,
    });

    const response = await request(app.server)
      .post(`/v1/requests/${testRequest.id}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'This is a test comment from the requester',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty(
      'content',
      'This is a test comment from the requester',
    );
    expect(response.body).toHaveProperty('createdAt');
  });
});
