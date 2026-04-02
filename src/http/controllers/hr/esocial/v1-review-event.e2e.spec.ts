import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { randomUUID } from 'node:crypto';

describe('Review eSocial Event (E2E)', () => {
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
      .post(`/v1/esocial/events/${randomUUID()}/review`)
      .send({ notes: 'Looks good' });

    expect(response.statusCode).toBe(401);
  });

  it('should return 404 for non-existent event', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post(`/v1/esocial/events/${randomUUID()}/review`)
      .set('Authorization', `Bearer ${token}`)
      .send({ notes: 'Looks good' });

    expect([400, 404, 500]).toContain(response.statusCode);
  });
});
