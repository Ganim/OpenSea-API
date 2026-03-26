import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';
import { createBonus } from '@/utils/tests/factories/hr/create-bonus.e2e';

describe('Update Bonus (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update a bonus successfully', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const employeeData = await createEmployeeE2E({ tenantId });
    const bonus = await createBonus(tenantId, employeeData.employee.id);

    const response = await request(app.server)
      .put(`/v1/hr/bonuses/${bonus.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Bonus Name',
        amount: 2500,
        reason: 'Updated reason for the bonus payment',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('bonus');
    expect(response.body.bonus.name).toBe('Updated Bonus Name');
    expect(response.body.bonus.amount).toBe(2500);
    expect(response.body.bonus.reason).toBe(
      'Updated reason for the bonus payment',
    );
  });

  it('should return 404 for non-existent bonus', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .put('/v1/hr/bonuses/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Name' });

    expect(response.statusCode).toBe(404);
  });
});
