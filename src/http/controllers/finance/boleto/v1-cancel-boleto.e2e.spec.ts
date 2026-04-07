import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { randomUUID } from 'node:crypto';

describe('Cancel Boleto (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should return error for non-existent boleto', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .delete('/v1/finance/boleto/00000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({
        entryId: randomUUID(),
        bankAccountId: randomUUID(),
      });

    expect([400, 404]).toContain(response.status);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .delete('/v1/finance/boleto/00000000000')
      .send({
        entryId: randomUUID(),
        bankAccountId: randomUUID(),
      });

    expect(response.status).toBe(401);
  });
});
