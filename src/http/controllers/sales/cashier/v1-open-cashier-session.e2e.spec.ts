import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Open Cashier Session (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/sales/cashier/sessions')
      .send({ openingBalance: 100 });

    expect(response.status).toBe(401);
  });

  it('should open a cashier session (201)', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/sales/cashier/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        openingBalance: 200,
        notes: `Test session ${Date.now()}`,
      });

    expect(response.status).toBe(201);
    expect(response.body.cashierSession).toBeDefined();
    expect(response.body.cashierSession.id).toBeDefined();
    expect(response.body.cashierSession.status).toBe('OPEN');
    expect(response.body.cashierSession.openingBalance).toBe(200);
  });
});
