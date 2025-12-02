import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import {
  createApprovedPayroll,
  createCalculatedPayroll,
  createPayroll,
} from '@/utils/tests/factories/hr/create-payroll.e2e';

describe('Cancel Payroll (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to cancel a draft payroll', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const payroll = await createPayroll({
      referenceMonth: 11,
      referenceYear: 2026,
    });

    const response = await request(app.server)
      .post(`/v1/hr/payrolls/${payroll.id}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('payroll');
    expect(response.body.payroll.status).toBe('CANCELLED');
  });

  it('should allow MANAGER to cancel a calculated payroll', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const payroll = await createCalculatedPayroll({
      referenceMonth: 12,
      referenceYear: 2026,
    });

    const response = await request(app.server)
      .post(`/v1/hr/payrolls/${payroll.id}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.payroll.status).toBe('CANCELLED');
  });

  it('should return 404 when payroll not found', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const response = await request(app.server)
      .post('/v1/hr/payrolls/00000000-0000-0000-0000-000000000000/cancel')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
  });

  it('should NOT allow USER to cancel a payroll', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const payroll = await createPayroll({
      referenceMonth: 1,
      referenceYear: 2027,
    });

    const response = await request(app.server)
      .post(`/v1/hr/payrolls/${payroll.id}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(403);
  });

  it('should return 401 when no token is provided', async () => {
    const payroll = await createPayroll({
      referenceMonth: 2,
      referenceYear: 2027,
    });

    const response = await request(app.server).post(
      `/v1/hr/payrolls/${payroll.id}/cancel`,
    );

    expect(response.statusCode).toBe(401);
  });

  it('should return 400 when trying to cancel a paid payroll', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    // Create a paid payroll
    const payroll = await createApprovedPayroll();
    await prisma.payroll.update({
      where: { id: payroll.id },
      data: { status: 'PAID', paidAt: new Date() },
    });

    const response = await request(app.server)
      .post(`/v1/hr/payrolls/${payroll.id}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);
  });
});
