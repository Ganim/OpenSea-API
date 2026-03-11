import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import {
  createFinancePrerequisites,
  createFinanceEntry,
} from '@/utils/tests/factories/finance/create-finance-test-data.e2e';

describe('Register Payment (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should register a payment for a finance entry', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { category, costCenter } = await createFinancePrerequisites(tenantId);

    const entry = await createFinanceEntry(tenantId, {
      categoryId: category.id,
      costCenterId: costCenter.id,
    });

    const response = await request(app.server)
      .post(`/v1/finance/entries/${entry.id}/payments`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 500,
        paidAt: new Date().toISOString(),
      });

    expect(response.status).toBe(201);
    expect(response.body.payment).toBeDefined();
    expect(response.body.payment.amount).toBe(500);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).post(
      '/v1/finance/entries/any-id/payments',
    );
    expect(response.status).toBe(401);
  });

  it('should return 400 when payment amount exceeds remaining balance', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { category, costCenter } = await createFinancePrerequisites(tenantId);

    const entry = await createFinanceEntry(
      tenantId,
      { categoryId: category.id, costCenterId: costCenter.id },
      { expectedAmount: 1000 },
    );

    const response = await request(app.server)
      .post(`/v1/finance/entries/${entry.id}/payments`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 5000,
        paidAt: new Date().toISOString(),
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('exceeds');
  });

  it('should return 400 when paying a cancelled entry', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { category, costCenter } = await createFinancePrerequisites(tenantId);

    const entry = await createFinanceEntry(
      tenantId,
      { categoryId: category.id, costCenterId: costCenter.id },
      { status: 'CANCELLED' },
    );

    const response = await request(app.server)
      .post(`/v1/finance/entries/${entry.id}/payments`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 500,
        paidAt: new Date().toISOString(),
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('cancelled');
  });

  it('should return 400 when paying an already fully paid entry', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { category, costCenter } = await createFinancePrerequisites(tenantId);

    const entry = await createFinanceEntry(
      tenantId,
      { categoryId: category.id, costCenterId: costCenter.id },
      { status: 'PAID' },
    );

    const response = await request(app.server)
      .post(`/v1/finance/entries/${entry.id}/payments`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 100,
        paidAt: new Date().toISOString(),
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('already fully paid');
  });

  it('should return 404 when entry does not exist', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const fakeId = randomUUID();
    const response = await request(app.server)
      .post(`/v1/finance/entries/${fakeId}/payments`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 500,
        paidAt: new Date().toISOString(),
      });

    expect(response.status).toBe(404);
  });

  it('should return 400 for negative payment amount', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { category, costCenter } = await createFinancePrerequisites(tenantId);

    const entry = await createFinanceEntry(tenantId, {
      categoryId: category.id,
      costCenterId: costCenter.id,
    });

    const response = await request(app.server)
      .post(`/v1/finance/entries/${entry.id}/payments`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: -100,
        paidAt: new Date().toISOString(),
      });

    expect(response.status).toBe(400);
  });

  it('should return 400 when paidAt is missing', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { category, costCenter } = await createFinancePrerequisites(tenantId);

    const entry = await createFinanceEntry(tenantId, {
      categoryId: category.id,
      costCenterId: costCenter.id,
    });

    const response = await request(app.server)
      .post(`/v1/finance/entries/${entry.id}/payments`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 500,
      });

    expect(response.status).toBe(400);
  });

  it('should allow partial payment and then the remainder', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { category, costCenter } = await createFinancePrerequisites(tenantId);

    const entry = await createFinanceEntry(
      tenantId,
      { categoryId: category.id, costCenterId: costCenter.id },
      { expectedAmount: 1000 },
    );

    // First partial payment
    const res1 = await request(app.server)
      .post(`/v1/finance/entries/${entry.id}/payments`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 600,
        paidAt: new Date().toISOString(),
      });

    expect(res1.status).toBe(201);
    expect(res1.body.entry.status).toBe('PARTIALLY_PAID');

    // Remaining payment
    const res2 = await request(app.server)
      .post(`/v1/finance/entries/${entry.id}/payments`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 400,
        paidAt: new Date().toISOString(),
      });

    expect(res2.status).toBe(201);
    expect(res2.body.entry.status).toBe('PAID');
  });
});
