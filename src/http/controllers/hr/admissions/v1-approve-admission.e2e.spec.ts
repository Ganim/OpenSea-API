import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createAdmissionInviteE2E } from '@/utils/tests/factories/hr/create-admission-invite.e2e';
import { generateRegistrationNumber } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Approve Admission (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const tenant = await createAndSetupTenant();
    tenantId = tenant.tenantId;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should approve an admission and create an employee', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { admissionInvite } = await createAdmissionInviteE2E({
      tenantId,
      status: 'PENDING',
    });

    const registrationNumber = generateRegistrationNumber();

    const response = await request(app.server)
      .post(`/v1/hr/admissions/${admissionInvite.id}/approve`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        registrationNumber,
        weeklyHours: 44,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('invite');
    expect(response.body).toHaveProperty('employee');
    expect(response.body.invite.status).toBe('COMPLETED');
    expect(response.body.employee).toHaveProperty('id');
    expect(response.body.employee.registrationNumber).toBe(registrationNumber);
  });

  it('should return 404 for non-existent invite', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/hr/admissions/00000000-0000-0000-0000-000000000000/approve')
      .set('Authorization', `Bearer ${token}`)
      .send({
        registrationNumber: generateRegistrationNumber(),
        weeklyHours: 44,
      });

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 400 when approving an already completed invite', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { admissionInvite } = await createAdmissionInviteE2E({
      tenantId,
      status: 'COMPLETED',
    });

    const response = await request(app.server)
      .post(`/v1/hr/admissions/${admissionInvite.id}/approve`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        registrationNumber: generateRegistrationNumber(),
        weeklyHours: 44,
      });

    expect([400, 409]).toContain(response.statusCode);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server)
      .post('/v1/hr/admissions/00000000-0000-0000-0000-000000000000/approve')
      .send({
        registrationNumber: 'EMP-001',
        weeklyHours: 44,
      });

    expect(response.statusCode).toBe(401);
  });
});
