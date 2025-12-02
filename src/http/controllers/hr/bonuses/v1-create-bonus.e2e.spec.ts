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

  it('should allow MANAGER to create a new bonus', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const { employeeId } = await createEmployeeE2E();
    const bonusData = generateBonusData(employeeId);

    const response = await request(app.server)
      .post('/v1/hr/bonuses')
      .set('Authorization', `Bearer ${token}`)
      .send(bonusData);

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('bonus');
    expect(response.body.bonus.name).toBe(bonusData.name);
    expect(response.body.bonus.amount).toBe(bonusData.amount);
    expect(response.body.bonus.isPaid).toBe(false);
  });

  it('should NOT allow USER to create a bonus', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const { employeeId } = await createEmployeeE2E();
    const bonusData = generateBonusData(employeeId);

    const response = await request(app.server)
      .post('/v1/hr/bonuses')
      .set('Authorization', `Bearer ${token}`)
      .send(bonusData);

    expect(response.statusCode).toBe(403);
  });

  it('should return 401 when no token is provided', async () => {
    const { employeeId } = await createEmployeeE2E();
    const bonusData = generateBonusData(employeeId);

    const response = await request(app.server)
      .post('/v1/hr/bonuses')
      .send(bonusData);

    expect(response.statusCode).toBe(401);
  });

  it('should return 404 when employee not found', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const bonusData = generateBonusData('550e8400-e29b-41d4-a716-446655440000');

    const response = await request(app.server)
      .post('/v1/hr/bonuses')
      .set('Authorization', `Bearer ${token}`)
      .send(bonusData);

    expect(response.statusCode).toBe(404);
  });
});
