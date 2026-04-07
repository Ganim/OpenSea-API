import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Return PPE (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should return 404 for non-existent assignment', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .patch('/v1/hr/ppe-assignments/clxxxxxxxxxxxxxxxxxxxxxxxxx/return')
      .set('Authorization', `Bearer ${token}`)
      .send({ condition: 'GOOD' });

    expect(response.status).not.toBe(401);
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server)
      .patch('/v1/hr/ppe-assignments/clxxxxxxxxxxxxxxxxxxxxxxxxx/return')
      .send({ condition: 'GOOD' });

    expect(response.status).toBe(401);
  });
});
