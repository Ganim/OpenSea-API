import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import {
  createFinancePrerequisites,
  createFinanceEntry,
  createFinanceCategory,
} from '@/utils/tests/factories/finance/create-finance-test-data.e2e';

describe('Bulk Finance Entry Operations (E2E)', () => {
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

  describe('POST /v1/finance/entries/bulk-pay', () => {
    it('should bulk pay multiple entries', async () => {
      const entry1 = await createFinanceEntry(tenantId, {
        categoryId,
        costCenterId,
      });
      const entry2 = await createFinanceEntry(tenantId, {
        categoryId,
        costCenterId,
      });

      const response = await request(app.server)
        .post('/v1/finance/entries/bulk-pay')
        .set('Authorization', `Bearer ${token}`)
        .send({
          entryIds: [entry1.id, entry2.id],
          bankAccountId,
          method: 'PIX',
        });

      expect(response.status).toBe(200);
      expect(response.body.succeeded).toBe(2);
      expect(response.body.failed).toBe(0);
    });

    it('should return 401 without auth', async () => {
      const response = await request(app.server)
        .post('/v1/finance/entries/bulk-pay')
        .send({ entryIds: [], bankAccountId: 'x', method: 'PIX' });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /v1/finance/entries/bulk-cancel', () => {
    it('should bulk cancel multiple entries', async () => {
      const entry1 = await createFinanceEntry(tenantId, {
        categoryId,
        costCenterId,
      });
      const entry2 = await createFinanceEntry(tenantId, {
        categoryId,
        costCenterId,
      });

      const response = await request(app.server)
        .post('/v1/finance/entries/bulk-cancel')
        .set('Authorization', `Bearer ${token}`)
        .send({
          entryIds: [entry1.id, entry2.id],
          reason: 'Testing bulk cancel',
        });

      expect(response.status).toBe(200);
      expect(response.body.succeeded).toBe(2);
      expect(response.body.failed).toBe(0);
    });

    it('should return 401 without auth', async () => {
      const response = await request(app.server)
        .post('/v1/finance/entries/bulk-cancel')
        .send({ entryIds: [] });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /v1/finance/entries/bulk-delete', () => {
    it('should bulk delete multiple entries', async () => {
      const entry1 = await createFinanceEntry(tenantId, {
        categoryId,
        costCenterId,
      });
      const entry2 = await createFinanceEntry(tenantId, {
        categoryId,
        costCenterId,
      });

      const response = await request(app.server)
        .delete('/v1/finance/entries/bulk-delete')
        .set('Authorization', `Bearer ${token}`)
        .send({
          entryIds: [entry1.id, entry2.id],
        });

      expect(response.status).toBe(200);
      expect(response.body.succeeded).toBe(2);
      expect(response.body.failed).toBe(0);
    });

    it('should return 401 without auth', async () => {
      const response = await request(app.server)
        .delete('/v1/finance/entries/bulk-delete')
        .send({ entryIds: [] });

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /v1/finance/entries/bulk-categorize', () => {
    it('should bulk categorize multiple entries', async () => {
      const entry1 = await createFinanceEntry(tenantId, {
        categoryId,
        costCenterId,
      });
      const entry2 = await createFinanceEntry(tenantId, {
        categoryId,
        costCenterId,
      });

      const newCategory = await createFinanceCategory(tenantId, {
        name: 'New Category',
      });

      const response = await request(app.server)
        .patch('/v1/finance/entries/bulk-categorize')
        .set('Authorization', `Bearer ${token}`)
        .send({
          entryIds: [entry1.id, entry2.id],
          categoryId: newCategory.id,
        });

      expect(response.status).toBe(200);
      expect(response.body.succeeded).toBe(2);
      expect(response.body.failed).toBe(0);
    });

    it('should return 404 for non-existent category', async () => {
      const entry = await createFinanceEntry(tenantId, {
        categoryId,
        costCenterId,
      });

      const response = await request(app.server)
        .patch('/v1/finance/entries/bulk-categorize')
        .set('Authorization', `Bearer ${token}`)
        .send({
          entryIds: [entry.id],
          categoryId: '00000000-0000-0000-0000-000000000000',
        });

      expect(response.status).toBe(404);
    });

    it('should return 401 without auth', async () => {
      const response = await request(app.server)
        .patch('/v1/finance/entries/bulk-categorize')
        .send({ entryIds: [], categoryId: 'x' });

      expect(response.status).toBe(401);
    });
  });
});
