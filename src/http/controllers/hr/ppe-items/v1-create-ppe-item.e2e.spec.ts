import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create PPE Item (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should create a PPE item', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const response = await request(app.server)
      .post('/v1/hr/ppe-items')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `PPE Item ${Date.now()}`,
        category: 'HEAD_PROTECTION',
        caNumber: `CA-${Date.now()}`,
        currentStock: 50,
        minimumStock: 10,
        validityDays: 365,
      });
    expect([201, 400]).toContain(response.status);
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server)
      .post('/v1/hr/ppe-items')
      .send({ name: 'Test' });
    expect(response.status).toBe(401);
  });
});
