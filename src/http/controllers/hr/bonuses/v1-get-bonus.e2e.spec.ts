import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createBonus } from '@/utils/tests/factories/hr/create-bonus.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Get Bonus (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to get a bonus by id', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const { employeeId } = await createEmployeeE2E();
    const bonus = await createBonus(employeeId, { name: 'Test Bonus' });

    const response = await request(app.server)
      .get(`/v1/hr/bonuses/${bonus.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('bonus');
    expect(response.body.bonus.id).toBe(bonus.id);
    expect(response.body.bonus.name).toBe('Test Bonus');
  });

  it('should return 404 when bonus not found', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const response = await request(app.server)
      .get('/v1/hr/bonuses/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
  });

  it('should return 401 when no token is provided', async () => {
    const { employeeId } = await createEmployeeE2E();
    const bonus = await createBonus(employeeId);

    const response = await request(app.server).get(
      `/v1/hr/bonuses/${bonus.id}`,
    );

    expect(response.statusCode).toBe(401);
  });
});
