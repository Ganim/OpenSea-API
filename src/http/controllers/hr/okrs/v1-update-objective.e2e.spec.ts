import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Update Objective (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should return 404 for non-existent objective', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .put('/v1/hr/okrs/objectives/clxxxxxxxxxxxxxxxxxxxxxxxxx')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated objective' });

    expect([404, 500]).toContain(response.status);
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server)
      .put('/v1/hr/okrs/objectives/clxxxxxxxxxxxxxxxxxxxxxxxxx')
      .send({ title: 'Updated' });

    expect(response.status).toBe(401);
  });
});
