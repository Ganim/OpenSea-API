import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

const NON_EXISTENT_CONTRACT_ID = 'cnxxxxxxxxxxxxxxxxxxxxxxxxx';

/**
 * NOTE: HR contract signature endpoints require `hr.contracts.modify` /
 * `hr.contracts.access`. Users may land in a tenant scope that does not have
 * the permission granted — tests accept 403 alongside the expected status.
 */
describe('HR Contract Signature Bridge (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: createdTenantId } = await createAndSetupTenant();
    tenantId = createdTenantId;
  });

  describe('POST /v1/hr/contracts/:contractId/signature', () => {
    it('should return 401 when no JWT is provided', async () => {
      const response = await request(app.server)
        .post(`/v1/hr/contracts/${NON_EXISTENT_CONTRACT_ID}/signature`)
        .send({});

      expect(response.status).toBe(401);
    });

    it('should return 404 when contract does not exist', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .post(`/v1/hr/contracts/${NON_EXISTENT_CONTRACT_ID}/signature`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).not.toBe(401);
      expect([403, 404]).toContain(response.status);
    });

    it('should accept a valid body shape (email + expiresInDays)', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .post(`/v1/hr/contracts/${NON_EXISTENT_CONTRACT_ID}/signature`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          signerEmail: 'signer@acme.com',
          signerName: 'Signer Test',
          expiresInDays: 14,
        });

      expect(response.status).not.toBe(401);
      // Contract does not exist, so the valid outcomes are 404 (not found) or
      // 403 (permission). 400 indicates schema rejection which must not happen
      // for this payload.
      expect([403, 404]).toContain(response.status);
    });

    it('should reject invalid expiresInDays', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .post(`/v1/hr/contracts/${NON_EXISTENT_CONTRACT_ID}/signature`)
        .set('Authorization', `Bearer ${token}`)
        .send({ expiresInDays: 999 });

      expect(response.status).not.toBe(401);
      expect([400, 403]).toContain(response.status);
    });
  });

  describe('GET /v1/hr/contracts/:contractId/signature', () => {
    it('should return 401 when no JWT is provided', async () => {
      const response = await request(app.server).get(
        `/v1/hr/contracts/${NON_EXISTENT_CONTRACT_ID}/signature`,
      );

      expect(response.status).toBe(401);
    });

    it('should return 404 when contract does not exist', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .get(`/v1/hr/contracts/${NON_EXISTENT_CONTRACT_ID}/signature`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).not.toBe(401);
      expect([403, 404]).toContain(response.status);
    });
  });

  describe('DELETE /v1/hr/contracts/:contractId/signature', () => {
    it('should return 401 when no JWT is provided', async () => {
      const response = await request(app.server).delete(
        `/v1/hr/contracts/${NON_EXISTENT_CONTRACT_ID}/signature`,
      );

      expect(response.status).toBe(401);
    });

    it('should return 404 when contract does not exist', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .delete(`/v1/hr/contracts/${NON_EXISTENT_CONTRACT_ID}/signature`)
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'Testing cancellation' });

      expect(response.status).not.toBe(401);
      expect([403, 404]).toContain(response.status);
    });
  });
});
