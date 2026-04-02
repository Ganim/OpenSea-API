import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Bids (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/bids', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .post('/v1/bids')
        .send({ title: 'Test Bid' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /v1/bids', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .get('/v1/bids');

      expect(response.status).toBe(401);
    });

    it('should list bids', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .get('/v1/bids')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.bids).toBeDefined();
      expect(Array.isArray(response.body.bids)).toBe(true);
      expect(response.body.meta).toBeDefined();
    });
  });

  describe('GET /v1/bids/:id', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .get('/v1/bids/00000000-0000-0000-0000-000000000001');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /v1/bids/:id', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .put('/v1/bids/00000000-0000-0000-0000-000000000001')
        .send({ title: 'Updated Bid' });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /v1/bids/:id', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .delete('/v1/bids/00000000-0000-0000-0000-000000000001');

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /v1/bids/:bidId/status', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .patch('/v1/bids/00000000-0000-0000-0000-000000000001/status')
        .send({ status: 'ACTIVE' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /v1/bids/:bidId/items', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .get('/v1/bids/00000000-0000-0000-0000-000000000001/items');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /v1/bids/:bidId/history', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .get('/v1/bids/00000000-0000-0000-0000-000000000001/history');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /v1/bid-documents', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .post('/v1/bid-documents')
        .send({});

      expect(response.status).toBe(401);
    });
  });

  describe('GET /v1/bid-documents', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .get('/v1/bid-documents');

      expect(response.status).toBe(401);
    });

    it('should list bid documents', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .get('/v1/bid-documents')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.documents).toBeDefined();
      expect(Array.isArray(response.body.documents)).toBe(true);
    });
  });

  describe('POST /v1/bid-contracts', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .post('/v1/bid-contracts')
        .send({});

      expect(response.status).toBe(401);
    });
  });

  describe('GET /v1/bid-contracts', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .get('/v1/bid-contracts');

      expect(response.status).toBe(401);
    });

    it('should list bid contracts', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .get('/v1/bid-contracts')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.contracts).toBeDefined();
      expect(Array.isArray(response.body.contracts)).toBe(true);
    });
  });

  describe('POST /v1/bid-empenhos', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .post('/v1/bid-empenhos')
        .send({});

      expect(response.status).toBe(401);
    });
  });
});
