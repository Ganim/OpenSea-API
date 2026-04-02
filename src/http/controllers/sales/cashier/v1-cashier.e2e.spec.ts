import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Cashier (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/sales/cashier/sessions', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .post('/v1/sales/cashier/sessions')
        .send({ openingBalance: 100 });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /v1/sales/cashier/sessions', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .get('/v1/sales/cashier/sessions');

      expect(response.status).toBe(401);
    });

    it('should list cashier sessions', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .get('/v1/sales/cashier/sessions')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.cashierSessions).toBeDefined();
      expect(Array.isArray(response.body.cashierSessions)).toBe(true);
    });
  });

  describe('GET /v1/sales/cashier/sessions/active', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .get('/v1/sales/cashier/sessions/active');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /v1/sales/cashier/sessions/:id', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .get('/v1/sales/cashier/sessions/00000000-0000-0000-0000-000000000001');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /v1/sales/cashier/sessions/:id/close', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .post('/v1/sales/cashier/sessions/00000000-0000-0000-0000-000000000001/close')
        .send({});

      expect(response.status).toBe(401);
    });
  });

  describe('POST /v1/sales/cashier/sessions/:id/transactions', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .post('/v1/sales/cashier/sessions/00000000-0000-0000-0000-000000000001/transactions')
        .send({});

      expect(response.status).toBe(401);
    });
  });

  describe('GET /v1/sales/cashier/sessions/:id/transactions', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .get('/v1/sales/cashier/sessions/00000000-0000-0000-0000-000000000001/transactions');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /v1/sales/cashier/sessions/:id/cash-movement', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .post('/v1/sales/cashier/sessions/00000000-0000-0000-0000-000000000001/cash-movement')
        .send({});

      expect(response.status).toBe(401);
    });
  });

  describe('POST /v1/sales/cashier/sessions/:id/reconcile', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .post('/v1/sales/cashier/sessions/00000000-0000-0000-0000-000000000001/reconcile')
        .send({});

      expect(response.status).toBe(401);
    });
  });
});
