import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Signature Template (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/signature/templates')
      .send({
        name: 'Test Template',
        description: 'A test signature template',
      });

    expect(response.status).toBe(401);
  });

  it('should reject invalid body', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/signature/templates')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});
