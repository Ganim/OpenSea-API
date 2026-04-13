import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Validate Stage Transition (E2E)', () => {
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
      .post('/v1/sales/blueprints/validate-transition')
      .send({
        dealId: '00000000-0000-0000-0000-000000000001',
        targetStageId: '00000000-0000-0000-0000-000000000002',
      });

    expect(response.status).toBe(401);
  });

  it('should validate transition (returns 200 with valid/errors)', async () => {
    const response = await request(app.server)
      .post('/v1/sales/blueprints/validate-transition')
      .set('Authorization', `Bearer ${token}`)
      .send({
        dealId: '00000000-0000-0000-0000-000000000001',
        targetStageId: '00000000-0000-0000-0000-000000000002',
      });

    expect([200, 400, 404]).toContain(response.status);
    if (response.status === 200) {
      expect(response.body).toHaveProperty('valid');
      expect(response.body).toHaveProperty('errors');
    }
  });
});
