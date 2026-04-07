import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createFinancePrerequisites } from '@/utils/tests/factories/finance/create-finance-test-data.e2e';

describe('Create Finance Entry (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should create a finance entry', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { category, costCenter } = await createFinancePrerequisites(tenantId);

    const response = await request(app.server)
      .post('/v1/finance/entries')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'PAYABLE',
        description: `E2E test entry ${Date.now()}`,
        categoryId: category.id,
        costCenterId: costCenter.id,
        expectedAmount: 1500,
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

    expect(response.status).toBe(201);
    expect(response.body.entry).toBeDefined();
    expect(response.body.entry.description).toContain('E2E test entry');
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).post('/v1/finance/entries');
    expect(response.status).toBe(401);
  });

  it('should return 400 when required fields are missing', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/finance/entries')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(400);
  });

  it('should return 400 when type is missing', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { category } = await createFinancePrerequisites(tenantId);

    const response = await request(app.server)
      .post('/v1/finance/entries')
      .set('Authorization', `Bearer ${token}`)
      .send({
        description: 'Missing type field',
        categoryId: category.id,
        expectedAmount: 100,
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

    expect(response.status).toBe(400);
  });

  it('should return 400 for invalid type value', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { category } = await createFinancePrerequisites(tenantId);

    const response = await request(app.server)
      .post('/v1/finance/entries')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'INVALID_TYPE',
        description: 'Invalid type test',
        categoryId: category.id,
        expectedAmount: 100,
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

    expect(response.status).toBe(400);
  });

  it('should return 400 for negative expectedAmount', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { category } = await createFinancePrerequisites(tenantId);

    const response = await request(app.server)
      .post('/v1/finance/entries')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'PAYABLE',
        description: 'Negative amount test',
        categoryId: category.id,
        expectedAmount: -500,
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

    expect(response.status).toBe(400);
  });

  it('should return 400 for zero expectedAmount', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { category } = await createFinancePrerequisites(tenantId);

    const response = await request(app.server)
      .post('/v1/finance/entries')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'PAYABLE',
        description: 'Zero amount test',
        categoryId: category.id,
        expectedAmount: 0,
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

    expect(response.status).toBe(400);
  });

  it('should return 400 when dueDate is before issueDate', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { category } = await createFinancePrerequisites(tenantId);

    const now = new Date();
    const pastDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const response = await request(app.server)
      .post('/v1/finance/entries')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'PAYABLE',
        description: 'Due before issue test',
        categoryId: category.id,
        expectedAmount: 100,
        issueDate: now.toISOString(),
        dueDate: pastDate.toISOString(),
      });

    expect(response.status).toBe(400);
  });

  it('should return 400 when description is empty', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { category } = await createFinancePrerequisites(tenantId);

    const response = await request(app.server)
      .post('/v1/finance/entries')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'PAYABLE',
        description: '',
        categoryId: category.id,
        expectedAmount: 100,
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

    expect(response.status).toBe(400);
  });

  it('should return 400 when categoryId is not a valid UUID', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/finance/entries')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'RECEIVABLE',
        description: 'Invalid categoryId test',
        categoryId: 'not-a-uuid',
        expectedAmount: 100,
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

    expect(response.status).toBe(400);
  });
});
