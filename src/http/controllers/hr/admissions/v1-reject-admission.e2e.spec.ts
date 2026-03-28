import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createAdmissionInviteE2E } from '@/utils/tests/factories/hr/create-admission-invite.e2e';

describe('Reject Admission (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const tenant = await createAndSetupTenant();
    tenantId = tenant.tenantId;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should reject an admission invite with a reason', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { admissionInvite } = await createAdmissionInviteE2E({
      tenantId,
      status: 'PENDING',
    });

    const response = await request(app.server)
      .post(`/v1/hr/admissions/${admissionInvite.id}/reject`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Candidate did not meet requirements' });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('message');
  });

  it('should reject an admission invite without a reason', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { admissionInvite } = await createAdmissionInviteE2E({
      tenantId,
      status: 'PENDING',
    });

    const response = await request(app.server)
      .post(`/v1/hr/admissions/${admissionInvite.id}/reject`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 404 for non-existent invite', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/hr/admissions/00000000-0000-0000-0000-000000000000/reject')
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Does not matter' });

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 400 when rejecting an already completed invite', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { admissionInvite } = await createAdmissionInviteE2E({
      tenantId,
      status: 'COMPLETED',
    });

    const response = await request(app.server)
      .post(`/v1/hr/admissions/${admissionInvite.id}/reject`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Too late' });

    expect([400]).toContain(response.statusCode);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server)
      .post('/v1/hr/admissions/00000000-0000-0000-0000-000000000000/reject')
      .send({ reason: 'No auth' });

    expect(response.statusCode).toBe(401);
  });
});
