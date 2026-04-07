import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('List PPE Items (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should list PPE items', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const response = await request(app.server)
      .get('/v1/hr/ppe-items')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('ppeItems');
    expect(response.body).toHaveProperty('total');
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server).get('/v1/hr/ppe-items');
    expect(response.status).toBe(401);
  });
});
