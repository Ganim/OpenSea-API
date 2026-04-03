import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Cancel Vacation Split (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should return 404 for non-existent split', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const response = await request(app.server)
      .patch('/v1/hr/vacation-periods/splits/00000000-0000-0000-0000-000000000000/cancel')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect([400, 404]).toContain(response.status);
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server)
      .patch('/v1/hr/vacation-periods/splits/00000000-0000-0000-0000-000000000000/cancel')
      .send({});
    expect(response.status).toBe(401);
  });
});
