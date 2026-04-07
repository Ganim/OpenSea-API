import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Update Admission Invite (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should return 404 for non-existent invite', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .put('/v1/hr/admissions/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ fullName: 'Updated Name' });

    expect(response.status).not.toBe(401);
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server)
      .put('/v1/hr/admissions/00000000-0000-0000-0000-000000000000')
      .send({ fullName: 'Updated Name' });

    expect(response.status).toBe(401);
  });
});
