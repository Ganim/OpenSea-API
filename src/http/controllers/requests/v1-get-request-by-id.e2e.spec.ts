import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createRequestE2E } from '@/utils/tests/factories/core/create-request.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Get Request by ID (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get request by id with correct schema', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });

    const testRequest = await createRequestE2E({
      title: 'Test Request for Get',
      description: 'Test description for get by id',
      targetId: user.user.id,
      requesterId: user.user.id,
    });

    const response = await request(app.server)
      .get(`/v1/requests/${testRequest.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('title');
    expect(response.body).toHaveProperty('description');
    expect(response.body).toHaveProperty('type');
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('requesterId');
  });
});
