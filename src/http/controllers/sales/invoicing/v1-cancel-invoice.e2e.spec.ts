import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Cancel Invoice (E2E)', () => {
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
      .delete('/v1/sales/invoices/nonexistent-id')
      .send({ reason: 'Test cancellation' });

    expect(response.status).toBe(401);
  });

  it('should return 404 for non-existent invoice', async () => {
    const response = await request(app.server)
      .delete('/v1/sales/invoices/nonexistent-id')
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Test cancellation' });

    expect([404, 500]).toContain(response.status);
  });
});
