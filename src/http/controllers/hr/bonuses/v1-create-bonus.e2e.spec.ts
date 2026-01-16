import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { generateBonusData } from '@/utils/tests/factories/hr/create-bonus.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Create Bonus (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create bonus with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const { employeeId } = await createEmployeeE2E();
    const bonusData = generateBonusData(employeeId);

    const response = await request(app.server)
      .post('/v1/hr/bonuses')
      .set('Authorization', `Bearer ${token}`)
      .send(bonusData);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('bonus');
    expect(response.body.bonus).toHaveProperty('id');
  });
});
