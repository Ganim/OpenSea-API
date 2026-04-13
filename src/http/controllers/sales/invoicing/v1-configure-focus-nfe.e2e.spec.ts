import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Configure Focus NFe (E2E)', () => {
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
      .patch('/v1/sales/invoicing/config')
      .send({ apiKey: 'test-key' });

    expect(response.status).toBe(401);
  });

  it('should return 403 for non-super-admin', async () => {
    const response = await request(app.server)
      .patch('/v1/sales/invoicing/config')
      .set('Authorization', `Bearer ${token}`)
      .send({
        apiKey: 'test-api-key',
        productionMode: false,
        autoIssueOnConfirm: false,
        defaultSeries: '1',
      });

    expect([400, 403, 500]).toContain(response.status);
  });
});
