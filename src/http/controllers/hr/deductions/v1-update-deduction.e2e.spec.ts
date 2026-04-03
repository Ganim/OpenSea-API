import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';
import { createDeduction } from '@/utils/tests/factories/hr/create-deduction.e2e';

describe('Update Deduction (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should update a deduction successfully', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const employee = await createEmployeeE2E({ tenantId });
    const deduction = await createDeduction(tenantId, employee.employee.id);

    const response = await request(app.server)
      .put(`/v1/hr/deductions/${deduction.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Deduction Name',
        amount: 750,
        reason: 'Updated reason for the deduction',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('deduction');
    expect(response.body.deduction.name).toBe('Updated Deduction Name');
    expect(response.body.deduction.amount).toBe(750);
    expect(response.body.deduction.reason).toBe(
      'Updated reason for the deduction',
    );
  });

  it('should return 404 for non-existent deduction', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .put('/v1/hr/deductions/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Name' });

    expect(response.statusCode).toBe(404);
  });
});
