import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createFinancePrerequisites } from '@/utils/tests/factories/finance/create-finance-test-data.e2e';

describe('Finance Budgets (E2E)', () => {
  let tenantId: string;
  let token: string;
  let categoryId: string;
  let costCenterId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
    const prereqs = await createFinancePrerequisites(tenantId);
    categoryId = prereqs.category.id;
    costCenterId = prereqs.costCenter.id;
  });

  // ─── CREATE ────────────────────────────────────────────────────────

  it('should create a budget', async () => {
    const response = await request(app.server)
      .post('/v1/finance/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        categoryId,
        year: 2026,
        month: 3,
        budgetAmount: 5000,
        notes: 'Test budget',
      });

    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
    expect(response.body.budgetAmount).toBe(5000);
    expect(response.body.year).toBe(2026);
    expect(response.body.month).toBe(3);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).post('/v1/finance/budgets');
    expect(response.status).toBe(401);
  });

  it('should return 400 for invalid month', async () => {
    const response = await request(app.server)
      .post('/v1/finance/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        categoryId,
        year: 2026,
        month: 13,
        budgetAmount: 5000,
      });

    expect(response.status).toBe(400);
  });

  // ─── LIST ──────────────────────────────────────────────────────────

  it('should list budgets', async () => {
    const response = await request(app.server)
      .get('/v1/finance/budgets?year=2026')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toBeDefined();
    expect(response.body.meta).toBeDefined();
    expect(response.body.meta.total).toBeGreaterThanOrEqual(1);
  });

  // ─── UPDATE ────────────────────────────────────────────────────────

  it('should update a budget', async () => {
    const createResponse = await request(app.server)
      .post('/v1/finance/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        categoryId,
        costCenterId,
        year: 2026,
        month: 6,
        budgetAmount: 3000,
      });

    const budgetId = createResponse.body.id;

    const updateResponse = await request(app.server)
      .patch(`/v1/finance/budgets/${budgetId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ budgetAmount: 4500 });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.budgetAmount).toBe(4500);
  });

  // ─── DELETE ────────────────────────────────────────────────────────

  it('should delete a budget', async () => {
    const createResponse = await request(app.server)
      .post('/v1/finance/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        categoryId,
        year: 2026,
        month: 12,
        budgetAmount: 1000,
      });

    const budgetId = createResponse.body.id;

    const deleteResponse = await request(app.server)
      .delete(`/v1/finance/budgets/${budgetId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteResponse.status).toBe(204);
  });

  // ─── BULK CREATE ───────────────────────────────────────────────────

  it('should bulk create budgets for a year', async () => {
    const response = await request(app.server)
      .post('/v1/finance/budgets/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({
        categoryId,
        costCenterId,
        year: 2027,
        monthlyBudgets: [
          { month: 1, budgetAmount: 5000 },
          { month: 2, budgetAmount: 5200 },
          { month: 3, budgetAmount: 5400 },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body.createdCount).toBe(3);
    expect(response.body.budgets).toHaveLength(3);
  });

  // ─── BUDGET VS ACTUAL ──────────────────────────────────────────────

  it('should return budget vs actual report', async () => {
    // Ensure at least one budget exists for this month
    await request(app.server)
      .post('/v1/finance/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        categoryId,
        year: 2026,
        month: 1,
        budgetAmount: 10000,
      });

    const response = await request(app.server)
      .get('/v1/finance/reports/budget-vs-actual?year=2026&month=1')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.rows).toBeDefined();
    expect(response.body.totals).toBeDefined();
    expect(response.body.totals).toHaveProperty('totalBudget');
    expect(response.body.totals).toHaveProperty('totalActual');
    expect(response.body.totals).toHaveProperty('overallStatus');
  });
});
