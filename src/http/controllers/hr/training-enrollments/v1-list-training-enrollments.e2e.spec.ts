import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTrainingProgramE2E } from '@/utils/tests/factories/hr/create-training-program.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('List Training Enrollments (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list training enrollments', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { trainingProgramId } = await createTrainingProgramE2E({
      tenantId,
    });
    const { employeeId: emp1 } = await createEmployeeE2E({ tenantId });
    const { employeeId: emp2 } = await createEmployeeE2E({ tenantId });

    await prisma.trainingEnrollment.createMany({
      data: [
        { tenantId, trainingProgramId, employeeId: emp1 },
        { tenantId, trainingProgramId, employeeId: emp2, status: 'COMPLETED' },
      ],
    });

    const response = await request(app.server)
      .get('/v1/hr/training-enrollments')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('enrollments');
    expect(response.body).toHaveProperty('total');
    expect(response.body.total).toBeGreaterThanOrEqual(2);
  });

  it('should filter by status', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/hr/training-enrollments?status=COMPLETED')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(
      response.body.enrollments.every(
        (enrollment: { status: string }) => enrollment.status === 'COMPLETED',
      ),
    ).toBe(true);
  });

  it('should reject unauthenticated request', async () => {
    const response = await request(app.server).get(
      '/v1/hr/training-enrollments',
    );

    expect(response.statusCode).toBe(401);
  });
});
