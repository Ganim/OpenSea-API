import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createFinancePrerequisites } from '@/utils/tests/factories/finance/create-finance-test-data.e2e';

describe('Finance Contracts (E2E)', () => {
  let tenantId: string;
  let token: string;
  let categoryId: string;
  let costCenterId: string;
  let bankAccountId: string;

  const futureDate = new Date(
    Date.now() + 365 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const now = new Date().toISOString();

  const validContract = () => ({
    title: `Contract E2E ${Date.now()}`,
    companyName: 'Test Supplier Co.',
    totalValue: 12000,
    paymentFrequency: 'MONTHLY',
    paymentAmount: 1000,
    startDate: now,
    endDate: futureDate,
    categoryId,
    costCenterId,
    bankAccountId,
  });

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


  // --- CREATE ---
  it('should create a contract', async () => {
    const response = await request(app.server)
      .post('/v1/finance/contracts')
      .set('Authorization', `Bearer ${token}`)
      .send(validContract());

    expect(response.status).toBe(201);
    expect(response.body.contract).toBeDefined();
    expect(response.body.contract.title).toContain('Contract E2E');
    expect(response.body.entriesGenerated).toBeTypeOf('number');
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .post('/v1/finance/contracts')
      .send(validContract());

    expect(response.status).toBe(401);
  });

  it('should return 400 when required fields are missing', async () => {
    const response = await request(app.server)
      .post('/v1/finance/contracts')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(400);
  });

  it('should return 400 for invalid paymentFrequency', async () => {
    const response = await request(app.server)
      .post('/v1/finance/contracts')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validContract(), paymentFrequency: 'INVALID' });

    expect(response.status).toBe(400);
  });

  // --- LIST ---
  it('should list contracts', async () => {
    const response = await request(app.server)
      .get('/v1/finance/contracts')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.contracts).toBeInstanceOf(Array);
    expect(response.body.meta).toBeDefined();
  });

  it('should list contracts with status filter', async () => {
    const response = await request(app.server)
      .get('/v1/finance/contracts?status=ACTIVE')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.contracts).toBeInstanceOf(Array);
  });

  // --- GET BY ID ---
  it('should get contract by id', async () => {
    const createRes = await request(app.server)
      .post('/v1/finance/contracts')
      .set('Authorization', `Bearer ${token}`)
      .send(validContract());

    const id = createRes.body.contract.id;
    const response = await request(app.server)
      .get(`/v1/finance/contracts/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.contract.id).toBe(id);
  });

  it('should return 404 for non-existent contract', async () => {
    const response = await request(app.server)
      .get('/v1/finance/contracts/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect([404, 400]).toContain(response.status);
  });

  // --- UPDATE ---
  it('should update a contract', async () => {
    const createRes = await request(app.server)
      .post('/v1/finance/contracts')
      .set('Authorization', `Bearer ${token}`)
      .send(validContract());

    const id = createRes.body.contract.id;
    const response = await request(app.server)
      .put(`/v1/finance/contracts/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated Title' });

    expect(response.status).toBe(200);
    expect(response.body.contract.title).toBe('Updated Title');
  });

  // --- DELETE ---
  it('should delete a contract', async () => {
    const createRes = await request(app.server)
      .post('/v1/finance/contracts')
      .set('Authorization', `Bearer ${token}`)
      .send(validContract());

    const id = createRes.body.contract.id;
    const response = await request(app.server)
      .delete(`/v1/finance/contracts/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect([200, 204]).toContain(response.status);
  });

  it('should return 404 when deleting non-existent contract', async () => {
    const response = await request(app.server)
      .delete('/v1/finance/contracts/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect([404, 400]).toContain(response.status);
  });

  // --- GENERATE ENTRIES ---
  it('should generate entries from contract', async () => {
    const createRes = await request(app.server)
      .post('/v1/finance/contracts')
      .set('Authorization', `Bearer ${token}`)
      .send(validContract());

    const id = createRes.body.contract.id;
    const response = await request(app.server)
      .post(`/v1/finance/contracts/${id}/generate-entries`)
      .set('Authorization', `Bearer ${token}`);

    expect([200, 201]).toContain(response.status);
  });

  // --- SUPPLIER HISTORY ---
  it('should get supplier history', async () => {
    const response = await request(app.server)
      .get('/v1/finance/contracts/supplier-history?companyName=Test')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.contracts).toBeInstanceOf(Array);
    expect(response.body.totalContracts).toBeTypeOf('number');
  });
});
