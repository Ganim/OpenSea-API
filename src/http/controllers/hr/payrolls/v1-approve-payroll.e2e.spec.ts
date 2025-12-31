import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import {
  createCalculatedPayroll,
  createPayroll,
} from '@/utils/tests/factories/hr/create-payroll.e2e';

describe('Approve Payroll (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to approve a calculated payroll', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const payroll = await createCalculatedPayroll({
      referenceMonth: 3,
      referenceYear: 2026,
    });

    const response = await request(app.server)
      .post(`/v1/hr/payrolls/${payroll.id}/approve`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('payroll');
    expect(response.body.payroll.status).toBe('APPROVED');
    expect(response.body.payroll.approvedAt).toBeDefined();
  });

  it('should return 404 when payroll not found', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .post('/v1/hr/payrolls/00000000-0000-0000-0000-000000000000/approve')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
  });

  it('should NOT allow user without permission to approve a payroll', async () => {
    const { token } = await createAndAuthenticateUser(app, );
    const payroll = await createCalculatedPayroll({
      referenceMonth: 4,
      referenceYear: 2026,
    });

    const response = await request(app.server)
      .post(`/v1/hr/payrolls/${payroll.id}/approve`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(403);
  });

  it('should return 401 when no token is provided', async () => {
    const payroll = await createCalculatedPayroll({
      referenceMonth: 5,
      referenceYear: 2026,
    });

    const response = await request(app.server).post(
      `/v1/hr/payrolls/${payroll.id}/approve`,
    );

    expect(response.statusCode).toBe(401);
  });

  it('should return 400 when payroll is not in CALCULATED status', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const payroll = await createPayroll({
      referenceMonth: 6,
      referenceYear: 2026,
      status: 'DRAFT',
    });

    const response = await request(app.server)
      .post(`/v1/hr/payrolls/${payroll.id}/approve`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);
  });
});
