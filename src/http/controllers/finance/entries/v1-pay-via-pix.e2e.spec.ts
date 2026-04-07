import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { randomUUID } from 'node:crypto';

describe('Pay Via Pix (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should return error for non-existent entry', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post(`/v1/finance/entries/${randomUUID()}/pay-via-pix`)
      .set('Authorization', `Bearer ${token}`)
      .send({ bankAccountId: randomUUID() });

    expect([400, 404]).toContain(response.status);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .post(`/v1/finance/entries/${randomUUID()}/pay-via-pix`)
      .send({ bankAccountId: randomUUID() });

    expect(response.status).toBe(401);
  });
});
