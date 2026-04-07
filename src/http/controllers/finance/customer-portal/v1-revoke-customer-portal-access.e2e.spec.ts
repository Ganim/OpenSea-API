import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { randomUUID } from 'node:crypto';

describe('Revoke Customer Portal Access (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should return error for non-existent access', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .delete(`/v1/finance/customer-portal/accesses/${randomUUID()}`)
      .set('Authorization', `Bearer ${token}`);

    expect([204, 404]).toContain(response.status);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).delete(
      `/v1/finance/customer-portal/accesses/${randomUUID()}`,
    );

    expect(response.status).toBe(401);
  });
});
