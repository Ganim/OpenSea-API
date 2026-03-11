import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createFinancePrerequisites } from '@/utils/tests/factories/finance/create-finance-test-data.e2e';

describe('Finance Recurring (E2E)', () => {
  let tenantId: string;
  let token: string;
  let categoryId: string;
  let costCenterId: string;
  let bankAccountId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
    const prereqs = await createFinancePrerequisites(tenantId);
    categoryId = prereqs.category.id;
    costCenterId = prereqs.costCenter.id;
    bankAccountId = prereqs.bankAccount.id;
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── CREATE ────────────────────────────────────────────────────────

  it('should create a recurring config', async () => {
    const response = await request(app.server)
      .post('/v1/finance/recurring')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'PAYABLE',
        description: `E2E recurring ${Date.now()}`,
        categoryId,
        costCenterId,
        bankAccountId,
        expectedAmount: 2500,
        frequencyUnit: 'MONTHLY',
        startDate: new Date().toISOString(),
      });

    expect(response.status).toBe(201);
    expect(response.body).toBeDefined();
    expect(response.body.id).toBeDefined();
    expect(response.body.status).toBe('ACTIVE');
    expect(response.body.frequencyUnit).toBe('MONTHLY');
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).post('/v1/finance/recurring');
    expect(response.status).toBe(401);
  });

  it('should return 400 when required fields are missing', async () => {
    const response = await request(app.server)
      .post('/v1/finance/recurring')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(400);
  });

  // ─── LIST ──────────────────────────────────────────────────────────

  it('should list recurring configs', async () => {
    // Create two configs to ensure listing works
    await request(app.server)
      .post('/v1/finance/recurring')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'PAYABLE',
        description: `List test payable ${Date.now()}`,
        categoryId,
        expectedAmount: 100,
        frequencyUnit: 'WEEKLY',
        startDate: new Date().toISOString(),
      });

    await request(app.server)
      .post('/v1/finance/recurring')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'RECEIVABLE',
        description: `List test receivable ${Date.now()}`,
        categoryId,
        expectedAmount: 200,
        frequencyUnit: 'MONTHLY',
        startDate: new Date().toISOString(),
      });

    const response = await request(app.server)
      .get('/v1/finance/recurring')
      .set('Authorization', `Bearer ${token}`)
      .query({ page: 1, limit: 20 });

    expect(response.status).toBe(200);
    expect(response.body.data).toBeDefined();
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.meta).toBeDefined();
    expect(response.body.meta.total).toBeGreaterThanOrEqual(2);
    expect(response.body.meta.page).toBe(1);
    expect(response.body.meta.limit).toBe(20);
    expect(response.body.meta.pages).toBeGreaterThanOrEqual(1);
  });

  it('should list recurring configs with type filter', async () => {
    await request(app.server)
      .post('/v1/finance/recurring')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'RECEIVABLE',
        description: `Filter test receivable ${Date.now()}`,
        categoryId,
        expectedAmount: 500,
        frequencyUnit: 'QUARTERLY',
        startDate: new Date().toISOString(),
      });

    const response = await request(app.server)
      .get('/v1/finance/recurring')
      .set('Authorization', `Bearer ${token}`)
      .query({ page: 1, limit: 20, type: 'RECEIVABLE' });

    expect(response.status).toBe(200);
    expect(response.body.data).toBeDefined();
    for (const config of response.body.data) {
      expect(config.type).toBe('RECEIVABLE');
    }
  });

  // ─── GET BY ID ─────────────────────────────────────────────────────

  it('should get recurring config by id', async () => {
    const createResponse = await request(app.server)
      .post('/v1/finance/recurring')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'PAYABLE',
        description: `Get by id test ${Date.now()}`,
        categoryId,
        expectedAmount: 750,
        frequencyUnit: 'BIWEEKLY',
        startDate: new Date().toISOString(),
      });

    const configId = createResponse.body.id;

    const response = await request(app.server)
      .get(`/v1/finance/recurring/${configId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
    expect(response.body.id).toBe(configId);
    expect(response.body.frequencyUnit).toBe('BIWEEKLY');
  });

  it('should return 404 for non-existent config', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const response = await request(app.server)
      .get(`/v1/finance/recurring/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  // ─── UPDATE ────────────────────────────────────────────────────────

  it('should update a recurring config', async () => {
    const createResponse = await request(app.server)
      .post('/v1/finance/recurring')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'PAYABLE',
        description: `Update test ${Date.now()}`,
        categoryId,
        expectedAmount: 300,
        frequencyUnit: 'MONTHLY',
        startDate: new Date().toISOString(),
      });

    const configId = createResponse.body.id;

    const response = await request(app.server)
      .put(`/v1/finance/recurring/${configId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        description: 'Updated description',
        expectedAmount: 999,
        frequencyUnit: 'WEEKLY',
        notes: 'Some notes',
      });

    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
    expect(response.body.description).toBe('Updated description');
    expect(response.body.expectedAmount).toBe(999);
  });

  // ─── PAUSE ─────────────────────────────────────────────────────────

  it('should pause a recurring config', async () => {
    const createResponse = await request(app.server)
      .post('/v1/finance/recurring')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'PAYABLE',
        description: `Pause test ${Date.now()}`,
        categoryId,
        expectedAmount: 400,
        frequencyUnit: 'DAILY',
        startDate: new Date().toISOString(),
      });

    const configId = createResponse.body.id;

    const response = await request(app.server)
      .patch(`/v1/finance/recurring/${configId}/pause`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
    expect(response.body.status).toBe('PAUSED');
  });

  // ─── RESUME ────────────────────────────────────────────────────────

  it('should resume a paused recurring config', async () => {
    const createResponse = await request(app.server)
      .post('/v1/finance/recurring')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'RECEIVABLE',
        description: `Resume test ${Date.now()}`,
        categoryId,
        expectedAmount: 600,
        frequencyUnit: 'ANNUAL',
        startDate: new Date().toISOString(),
      });

    const configId = createResponse.body.id;

    // Pause first
    await request(app.server)
      .patch(`/v1/finance/recurring/${configId}/pause`)
      .set('Authorization', `Bearer ${token}`);

    // Then resume
    const response = await request(app.server)
      .patch(`/v1/finance/recurring/${configId}/resume`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
    expect(response.body.status).toBe('ACTIVE');
  });

  // ─── CANCEL ────────────────────────────────────────────────────────

  it('should cancel a recurring config', async () => {
    const createResponse = await request(app.server)
      .post('/v1/finance/recurring')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'PAYABLE',
        description: `Cancel test ${Date.now()}`,
        categoryId,
        expectedAmount: 800,
        frequencyUnit: 'SEMIANNUAL',
        startDate: new Date().toISOString(),
      });

    const configId = createResponse.body.id;

    const response = await request(app.server)
      .patch(`/v1/finance/recurring/${configId}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
    expect(response.body.status).toBe('CANCELLED');
  });

  it('should return 400 when cancelling already cancelled config', async () => {
    const createResponse = await request(app.server)
      .post('/v1/finance/recurring')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'PAYABLE',
        description: `Double cancel test ${Date.now()}`,
        categoryId,
        expectedAmount: 150,
        frequencyUnit: 'MONTHLY',
        startDate: new Date().toISOString(),
      });

    const configId = createResponse.body.id;

    // Cancel once
    await request(app.server)
      .patch(`/v1/finance/recurring/${configId}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    // Try to cancel again
    const response = await request(app.server)
      .patch(`/v1/finance/recurring/${configId}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
  });
});
