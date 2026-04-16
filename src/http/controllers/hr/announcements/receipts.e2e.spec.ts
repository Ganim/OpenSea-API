import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

const NON_EXISTENT_ANNOUNCEMENT_ID = '00000000-0000-0000-0000-000000000000';

describe('Announcement Receipts and Stats (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: createdTenantId } = await createAndSetupTenant();
    tenantId = createdTenantId;
  });

  describe('POST /v1/hr/announcements/:id/read', () => {
    it('should reach the mark-read handler when authenticated', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .post(`/v1/hr/announcements/${NON_EXISTENT_ANNOUNCEMENT_ID}/read`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).not.toBe(401);
      expect([200, 404]).toContain(response.status);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.server).post(
        `/v1/hr/announcements/${NON_EXISTENT_ANNOUNCEMENT_ID}/read`,
      );

      expect(response.status).toBe(401);
    });
  });

  describe('GET /v1/hr/announcements/:id/receipts', () => {
    it('should reach the list receipts handler when authenticated', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .get(`/v1/hr/announcements/${NON_EXISTENT_ANNOUNCEMENT_ID}/receipts`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).not.toBe(401);
      expect([200, 404]).toContain(response.status);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.server).get(
        `/v1/hr/announcements/${NON_EXISTENT_ANNOUNCEMENT_ID}/receipts`,
      );

      expect(response.status).toBe(401);
    });
  });

  describe('GET /v1/hr/announcements/:id/stats', () => {
    it('should reach the stats handler when authenticated', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .get(`/v1/hr/announcements/${NON_EXISTENT_ANNOUNCEMENT_ID}/stats`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).not.toBe(401);
      expect([200, 404]).toContain(response.status);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.server).get(
        `/v1/hr/announcements/${NON_EXISTENT_ANNOUNCEMENT_ID}/stats`,
      );

      expect(response.status).toBe(401);
    });
  });
});
