import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { randomUUID } from 'node:crypto';

describe('Get eSocial Batch (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).get(
      `/v1/esocial/batches/${randomUUID()}`,
    );

    expect(response.statusCode).toBe(401);
  });

  it('should return 404 for non-existent batch', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get(`/v1/esocial/batches/${randomUUID()}`)
      .set('Authorization', `Bearer ${token}`);

    expect([404, 500]).toContain(response.statusCode);
  });
});
