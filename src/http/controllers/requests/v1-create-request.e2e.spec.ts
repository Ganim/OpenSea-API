import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Create Request (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create request with correct schema', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/requests')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: `Test Request ${timestamp}`,
        description: 'This is a test request description',
        type: 'ACCESS_REQUEST',
        priority: 'MEDIUM',
        targetType: 'USER',
        targetId: user.user.id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('title');
    expect(response.body).toHaveProperty('status');
  });
});
