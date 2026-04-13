import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Combo (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/combos')
      .send({ name: 'Test Combo' });

    expect(response.status).toBe(401);
  });

  it('should create a combo (201)', async () => {
    const response = await request(app.server)
      .post('/v1/combos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Combo E2E ${Date.now()}`,
        description: 'Test combo',
        type: 'FIXED',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        isActive: true,
      });

    expect(response.status).toBe(201);
    expect(response.body.combo).toBeDefined();
    expect(response.body.combo).toHaveProperty('id');
  });
});
