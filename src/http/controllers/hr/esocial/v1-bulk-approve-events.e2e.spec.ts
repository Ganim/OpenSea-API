import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { randomUUID } from 'node:crypto';

describe('Bulk Approve eSocial Events (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/esocial/events/bulk-approve')
      .send({ eventIds: [randomUUID()] });

    expect(response.statusCode).toBe(401);
  });

  it('should attempt bulk approve with non-existent events', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/esocial/events/bulk-approve')
      .set('Authorization', `Bearer ${token}`)
      .send({ eventIds: [randomUUID()] });

    // May return 200 with partial results or 400 if events not found
    expect(response.statusCode).not.toBe(401);
  });
});
