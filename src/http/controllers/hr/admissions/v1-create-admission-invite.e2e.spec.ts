import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { generateAdmissionInviteData } from '@/utils/tests/factories/hr/create-admission-invite.e2e';

describe('Create Admission Invite (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const tenant = await createAndSetupTenant();
    tenantId = tenant.tenantId;
  });


  it('should create an admission invite successfully', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const inviteData = generateAdmissionInviteData();

    const response = await request(app.server)
      .post('/v1/hr/admissions')
      .set('Authorization', `Bearer ${token}`)
      .send(inviteData);

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('invite');
    expect(response.body.invite).toHaveProperty('id');
    expect(response.body.invite).toHaveProperty('token');
    expect(response.body.invite.fullName).toBe(inviteData.fullName);
    expect(response.body.invite.email).toBe(inviteData.email);
    expect(response.body.invite.status).toBe('PENDING');
    expect(response.body.invite.contractType).toBe(inviteData.contractType);
    expect(response.body.invite.workRegime).toBe(inviteData.workRegime);
  });

  it('should create an admission invite with only required fields', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/hr/admissions')
      .set('Authorization', `Bearer ${token}`)
      .send({ fullName: 'João da Silva' });

    expect(response.statusCode).toBe(201);
    expect(response.body.invite.fullName).toBe('João da Silva');
    expect(response.body.invite.status).toBe('PENDING');
  });

  it('should return 401 when not authenticated', async () => {
    const inviteData = generateAdmissionInviteData();

    const response = await request(app.server)
      .post('/v1/hr/admissions')
      .send(inviteData);

    expect(response.statusCode).toBe(401);
  });
});
