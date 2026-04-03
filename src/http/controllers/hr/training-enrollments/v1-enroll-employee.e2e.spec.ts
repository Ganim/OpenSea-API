import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTrainingProgramE2E } from '@/utils/tests/factories/hr/create-training-program.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Enroll Employee in Training (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should enroll an employee in a training program', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { trainingProgramId } = await createTrainingProgramE2E({
      tenantId,
    });
    const { employeeId } = await createEmployeeE2E({ tenantId });

    const response = await request(app.server)
      .post('/v1/hr/training-enrollments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        trainingProgramId,
        employeeId,
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.enrollment).toBeDefined();
    expect(response.body.enrollment.status).toBe('ENROLLED');
    expect(response.body.enrollment.trainingProgramId).toBe(trainingProgramId);
    expect(response.body.enrollment.employeeId).toBe(employeeId);
  });

  it('should reject duplicate enrollment', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { trainingProgramId } = await createTrainingProgramE2E({
      tenantId,
    });
    const { employeeId } = await createEmployeeE2E({ tenantId });

    await request(app.server)
      .post('/v1/hr/training-enrollments')
      .set('Authorization', `Bearer ${token}`)
      .send({ trainingProgramId, employeeId });

    const response = await request(app.server)
      .post('/v1/hr/training-enrollments')
      .set('Authorization', `Bearer ${token}`)
      .send({ trainingProgramId, employeeId });

    expect(response.statusCode).toBe(400);
  });

  it('should reject unauthenticated request', async () => {
    const response = await request(app.server)
      .post('/v1/hr/training-enrollments')
      .send({
        trainingProgramId: '00000000-0000-0000-0000-000000000000',
        employeeId: '00000000-0000-0000-0000-000000000000',
      });

    expect(response.statusCode).toBe(401);
  });
});
