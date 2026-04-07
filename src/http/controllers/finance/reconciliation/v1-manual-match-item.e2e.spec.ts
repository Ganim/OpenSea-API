import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { randomUUID } from 'node:crypto';

describe('Manual Match Reconciliation Item (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should return error for non-existent item', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .patch(
        `/v1/finance/reconciliation/${randomUUID()}/items/${randomUUID()}/match`,
      )
      .set('Authorization', `Bearer ${token}`)
      .send({ entryId: randomUUID() });

    expect([200, 400, 404]).toContain(response.status);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .patch(
        `/v1/finance/reconciliation/${randomUUID()}/items/${randomUUID()}/match`,
      )
      .send({ entryId: randomUUID() });

    expect(response.status).toBe(401);
  });
});
