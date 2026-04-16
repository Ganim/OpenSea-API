import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

const NON_EXISTENT_REVIEW_ID = 'clxxxxxxxxxxxxxxxxxxxxxxxxx';
const NON_EXISTENT_COMPETENCY_ID = 'clyyyyyyyyyyyyyyyyyyyyyyyyy';

describe('Performance Review Competencies (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: createdTenantId } = await createAndSetupTenant();
    tenantId = createdTenantId;
  });

  describe('POST /v1/hr/performance-reviews/:reviewId/competencies', () => {
    it('should reach the create handler when authenticated', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .post(
          `/v1/hr/performance-reviews/${NON_EXISTENT_REVIEW_ID}/competencies`,
        )
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Técnica',
          weight: 1.5,
        });

      expect(response.status).not.toBe(401);
      expect([400, 404]).toContain(response.status);
    });

    it('should return 400 when payload is invalid (missing name)', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .post(
          `/v1/hr/performance-reviews/${NON_EXISTENT_REVIEW_ID}/competencies`,
        )
        .set('Authorization', `Bearer ${token}`)
        .send({
          weight: 1.5,
        });

      expect(response.status).toBe(400);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.server)
        .post(
          `/v1/hr/performance-reviews/${NON_EXISTENT_REVIEW_ID}/competencies`,
        )
        .send({
          name: 'Técnica',
          weight: 1.5,
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /v1/hr/performance-reviews/:reviewId/competencies', () => {
    it('should reach the list handler when authenticated', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .get(
          `/v1/hr/performance-reviews/${NON_EXISTENT_REVIEW_ID}/competencies`,
        )
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).not.toBe(401);
      expect([200, 404]).toContain(response.status);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.server).get(
        `/v1/hr/performance-reviews/${NON_EXISTENT_REVIEW_ID}/competencies`,
      );

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /v1/hr/performance-reviews/:reviewId/competencies/:competencyId', () => {
    it('should reach the update handler when authenticated', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .patch(
          `/v1/hr/performance-reviews/${NON_EXISTENT_REVIEW_ID}/competencies/${NON_EXISTENT_COMPETENCY_ID}`,
        )
        .set('Authorization', `Bearer ${token}`)
        .send({
          selfScore: 4,
          comments: 'Bom desempenho.',
        });

      expect(response.status).not.toBe(401);
      expect([400, 404]).toContain(response.status);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.server)
        .patch(
          `/v1/hr/performance-reviews/${NON_EXISTENT_REVIEW_ID}/competencies/${NON_EXISTENT_COMPETENCY_ID}`,
        )
        .send({ selfScore: 4 });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /v1/hr/performance-reviews/:reviewId/competencies/:competencyId', () => {
    it('should reach the delete handler when authenticated', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .delete(
          `/v1/hr/performance-reviews/${NON_EXISTENT_REVIEW_ID}/competencies/${NON_EXISTENT_COMPETENCY_ID}`,
        )
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).not.toBe(401);
      expect([204, 400, 404]).toContain(response.status);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.server).delete(
        `/v1/hr/performance-reviews/${NON_EXISTENT_REVIEW_ID}/competencies/${NON_EXISTENT_COMPETENCY_ID}`,
      );

      expect(response.status).toBe(401);
    });
  });

  describe('POST /v1/hr/performance-reviews/:reviewId/competencies/seed-defaults', () => {
    it('should reach the seed-defaults handler when authenticated', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .post(
          `/v1/hr/performance-reviews/${NON_EXISTENT_REVIEW_ID}/competencies/seed-defaults`,
        )
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).not.toBe(401);
      expect([200, 400, 404]).toContain(response.status);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.server)
        .post(
          `/v1/hr/performance-reviews/${NON_EXISTENT_REVIEW_ID}/competencies/seed-defaults`,
        )
        .send({});

      expect(response.status).toBe(401);
    });
  });

  describe('GET /v1/hr/performance-reviews/:performanceReviewId (extended with competencies + scores)', () => {
    it('should return 404 for non-existent review', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .get(`/v1/hr/performance-reviews/${NON_EXISTENT_REVIEW_ID}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.server).get(
        `/v1/hr/performance-reviews/${NON_EXISTENT_REVIEW_ID}`,
      );

      expect(response.status).toBe(401);
    });
  });
});
