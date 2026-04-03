import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Quote (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/sales/quotes')
      .send({
        customerId: '00000000-0000-0000-0000-000000000000',
        title: 'Test Quote',
        items: [{ productName: 'Item 1', quantity: 1, unitPrice: 100 }],
      });

    expect(response.status).toBe(401);
  });
});
