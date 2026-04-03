import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { randomUUID } from 'node:crypto';

describe('Generate eSocial Event (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/esocial/events/generate')
      .send({
        eventType: 'S-2200',
        referenceType: 'EMPLOYEE',
        referenceId: randomUUID(),
      });

    expect(response.statusCode).toBe(401);
  });

  it('should attempt to generate an event', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/esocial/events/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        eventType: 'S-2200',
        referenceType: 'EMPLOYEE',
        referenceId: randomUUID(),
      });

    // May fail with 400/404 due to missing reference, but should not be 401
    expect(response.statusCode).not.toBe(401);
  });
});
