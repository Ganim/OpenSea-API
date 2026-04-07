import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createAdmissionInviteE2E } from '@/utils/tests/factories/hr/create-admission-invite.e2e';

describe('Get Admission Invite (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const tenant = await createAndSetupTenant();
    tenantId = tenant.tenantId;
  });

  it('should get an admission invite by id', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { admissionInvite } = await createAdmissionInviteE2E({ tenantId });

    const response = await request(app.server)
      .get(`/v1/hr/admissions/${admissionInvite.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('invite');
    expect(response.body.invite.id).toBe(admissionInvite.id);
    expect(response.body.invite.fullName).toBe(admissionInvite.fullName);
    expect(response.body.invite.status).toBe(admissionInvite.status);
  });

  it('should return 404 for non-existent invite', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/hr/admissions/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server).get(
      '/v1/hr/admissions/00000000-0000-0000-0000-000000000000',
    );

    expect(response.statusCode).toBe(401);
  });
});
