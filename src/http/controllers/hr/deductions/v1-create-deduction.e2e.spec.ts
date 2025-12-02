import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { generateDeductionData } from '@/utils/tests/factories/hr/create-deduction.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Create Deduction (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to create a new deduction', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const { employeeId } = await createEmployeeE2E();
    const deductionData = generateDeductionData(employeeId);

    const response = await request(app.server)
      .post('/v1/hr/deductions')
      .set('Authorization', `Bearer ${token}`)
      .send(deductionData);

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('deduction');
    expect(response.body.deduction.name).toBe(deductionData.name);
    expect(response.body.deduction.amount).toBe(deductionData.amount);
    expect(response.body.deduction.isApplied).toBe(false);
  });

  it('should create a recurring deduction with installments', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const { employeeId } = await createEmployeeE2E();
    const deductionData = generateDeductionData(employeeId, {
      isRecurring: true,
      installments: 12,
    });

    const response = await request(app.server)
      .post('/v1/hr/deductions')
      .set('Authorization', `Bearer ${token}`)
      .send(deductionData);

    expect(response.statusCode).toBe(201);
    expect(response.body.deduction.isRecurring).toBe(true);
    expect(response.body.deduction.installments).toBe(12);
  });

  it('should NOT allow USER to create a deduction', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const { employeeId } = await createEmployeeE2E();
    const deductionData = generateDeductionData(employeeId);

    const response = await request(app.server)
      .post('/v1/hr/deductions')
      .set('Authorization', `Bearer ${token}`)
      .send(deductionData);

    expect(response.statusCode).toBe(403);
  });

  it('should return 401 when no token is provided', async () => {
    const { employeeId } = await createEmployeeE2E();
    const deductionData = generateDeductionData(employeeId);

    const response = await request(app.server)
      .post('/v1/hr/deductions')
      .send(deductionData);

    expect(response.statusCode).toBe(401);
  });

  it('should return 404 when employee not found', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const deductionData = generateDeductionData('550e8400-e29b-41d4-a716-446655440000');

    const response = await request(app.server)
      .post('/v1/hr/deductions')
      .set('Authorization', `Bearer ${token}`)
      .send(deductionData);

    expect(response.statusCode).toBe(404);
  });
});
