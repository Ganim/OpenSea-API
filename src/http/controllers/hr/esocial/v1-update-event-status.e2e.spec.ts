import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { randomUUID } from 'node:crypto';

describe('Update eSocial Event Status (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .patch(`/v1/esocial/events/${randomUUID()}/status`)
      .send({ action: 'approve' });

    expect(response.statusCode).toBe(401);
  });

  it('should return 404 for non-existent event', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .patch(`/v1/esocial/events/${randomUUID()}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ action: 'approve' });

    expect([400, 404]).toContain(response.statusCode);
  });
});
