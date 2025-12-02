import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createBonus } from '@/utils/tests/factories/hr/create-bonus.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('List Bonuses (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to list bonuses', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const { employeeId } = await createEmployeeE2E();

    await createBonus(employeeId, { name: 'Bonus 1' });
    await createBonus(employeeId, { name: 'Bonus 2' });

    const response = await request(app.server)
      .get('/v1/hr/bonuses')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('bonuses');
    expect(Array.isArray(response.body.bonuses)).toBe(true);
    expect(response.body.bonuses.length).toBeGreaterThanOrEqual(2);
  });

  it('should filter bonuses by employee', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const employee1 = await createEmployeeE2E();
    const employee2 = await createEmployeeE2E();

    await createBonus(employee1.employeeId, { name: 'Emp1 Bonus' });
    await createBonus(employee2.employeeId, { name: 'Emp2 Bonus' });

    const response = await request(app.server)
      .get('/v1/hr/bonuses')
      .query({ employeeId: employee1.employeeId })
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    response.body.bonuses.forEach((bonus: { employeeId: string }) => {
      expect(bonus.employeeId).toBe(employee1.employeeId);
    });
  });

  it('should return 401 when no token is provided', async () => {
    const response = await request(app.server).get('/v1/hr/bonuses');

    expect(response.statusCode).toBe(401);
  });
});
