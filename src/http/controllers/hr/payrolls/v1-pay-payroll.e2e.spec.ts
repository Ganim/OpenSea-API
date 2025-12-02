import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import {
  createApprovedPayroll,
  createPayroll,
} from '@/utils/tests/factories/hr/create-payroll.e2e';

describe('Pay Payroll (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to pay an approved payroll', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const payroll = await createApprovedPayroll({
      referenceMonth: 7,
      referenceYear: 2026,
    });

    const response = await request(app.server)
      .post(`/v1/hr/payrolls/${payroll.id}/pay`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('payroll');
    expect(response.body.payroll.status).toBe('PAID');
    expect(response.body.payroll.paidAt).toBeDefined();
  });

  it('should return 404 when payroll not found', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const response = await request(app.server)
      .post('/v1/hr/payrolls/00000000-0000-0000-0000-000000000000/pay')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
  });

  it('should NOT allow USER to pay a payroll', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const payroll = await createApprovedPayroll({
      referenceMonth: 8,
      referenceYear: 2026,
    });

    const response = await request(app.server)
      .post(`/v1/hr/payrolls/${payroll.id}/pay`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(403);
  });

  it('should return 401 when no token is provided', async () => {
    const payroll = await createApprovedPayroll({
      referenceMonth: 9,
      referenceYear: 2026,
    });

    const response = await request(app.server).post(
      `/v1/hr/payrolls/${payroll.id}/pay`,
    );

    expect(response.statusCode).toBe(401);
  });

  it('should return 400 when payroll is not in APPROVED status', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const payroll = await createPayroll({
      referenceMonth: 10,
      referenceYear: 2026,
      status: 'DRAFT',
    });

    const response = await request(app.server)
      .post(`/v1/hr/payrolls/${payroll.id}/pay`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);
  });
});
