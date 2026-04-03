import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createAdmissionInviteE2E } from '@/utils/tests/factories/hr/create-admission-invite.e2e';

describe('List Admission Invites (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const tenant = await createAndSetupTenant();
    tenantId = tenant.tenantId;
  });


  it('should list admission invites with pagination', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    await createAdmissionInviteE2E({ tenantId });
    await createAdmissionInviteE2E({ tenantId });

    const response = await request(app.server)
      .get('/v1/hr/admissions')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('invites');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.invites)).toBe(true);
    expect(response.body.invites.length).toBeGreaterThanOrEqual(2);
    expect(response.body.meta).toHaveProperty('total');
    expect(response.body.meta).toHaveProperty('page');
    expect(response.body.meta).toHaveProperty('perPage');
    expect(response.body.meta).toHaveProperty('totalPages');
  });

  it('should filter admission invites by status', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    await createAdmissionInviteE2E({ tenantId, status: 'CANCELLED' });

    const response = await request(app.server)
      .get('/v1/hr/admissions?status=CANCELLED')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.invites.length).toBeGreaterThanOrEqual(1);

    for (const invite of response.body.invites) {
      expect(invite.status).toBe('CANCELLED');
    }
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server).get('/v1/hr/admissions');

    expect(response.statusCode).toBe(401);
  });
});
