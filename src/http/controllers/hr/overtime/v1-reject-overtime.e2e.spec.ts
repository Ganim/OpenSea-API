import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Reject Overtime (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should reject overtime with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { employeeId } = await createEmployeeE2E({ tenantId });

    const overtime = await prisma.overtime.create({
      data: {
        tenantId,
        employeeId,
        date: new Date('2024-01-15'),
        hours: 2,
        reason: 'Project deadline',
        approved: false,
        rejected: false,
      },
    });

    const response = await request(app.server)
      .patch(`/v1/hr/overtime/${overtime.id}/reject`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        rejectionReason: 'Budget constraints do not allow overtime this period',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('overtime');
    expect(response.body.overtime.rejected).toBe(true);
    expect(response.body.overtime.rejectionReason).toBe(
      'Budget constraints do not allow overtime this period',
    );
  });
});
