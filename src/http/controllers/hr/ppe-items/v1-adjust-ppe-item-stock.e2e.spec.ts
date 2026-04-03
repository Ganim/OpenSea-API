import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Adjust PPE Item Stock (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should return 404 for non-existent PPE item', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const response = await request(app.server)
      .patch('/v1/hr/ppe-items/clxxxxxxxxxxxxxxxxxxxxxxxxx/stock')
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 10, reason: 'Restock' });
    expect(response.status).toBe(404);
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server)
      .patch('/v1/hr/ppe-items/clxxxxxxxxxxxxxxxxxxxxxxxxx/stock')
      .send({ quantity: 10 });
    expect(response.status).toBe(401);
  });
});
