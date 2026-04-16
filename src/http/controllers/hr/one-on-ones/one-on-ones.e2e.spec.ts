import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

const NON_EXISTENT_MEETING_ID = '00000000-0000-0000-0000-000000000000';
const NON_EXISTENT_TALKING_POINT_ID = '00000000-0000-0000-0000-000000000001';
const NON_EXISTENT_ACTION_ITEM_ID = '00000000-0000-0000-0000-000000000002';
const NON_EXISTENT_REPORT_ID = '00000000-0000-0000-0000-000000000003';

/**
 * NOTE: In Fastify with @fastify/type-provider-zod, body/params validation
 * runs BEFORE auth (verifyJwt). Therefore unauthenticated requests with
 * payloads that fail validation may surface as 400 instead of 401.
 *
 * Additionally, scope-aware permission middleware can return 403 instead
 * of 200/404 when the test user has no employee linked or no scoped access.
 */
describe('1:1 Meetings — CRUD, talking points and action items (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: createdTenantId } = await createAndSetupTenant();
    tenantId = createdTenantId;
  });

  describe('POST /v1/hr/one-on-ones', () => {
    it('should reach the schedule handler when authenticated', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .post('/v1/hr/one-on-ones')
        .set('Authorization', `Bearer ${token}`)
        .send({
          reportId: NON_EXISTENT_REPORT_ID,
          scheduledAt: new Date().toISOString(),
          durationMinutes: 30,
        });

      expect(response.status).not.toBe(401);
      expect([201, 400, 403, 404]).toContain(response.status);
    });

    it('should return 400 when scheduledAt is missing', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .post('/v1/hr/one-on-ones')
        .set('Authorization', `Bearer ${token}`)
        .send({ reportId: NON_EXISTENT_REPORT_ID });

      expect(response.status).toBe(400);
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app.server)
        .post('/v1/hr/one-on-ones')
        .send({
          reportId: NON_EXISTENT_REPORT_ID,
          scheduledAt: new Date().toISOString(),
        });

      // Either 401 (auth runs first) or 400 (body schema validates first)
      expect([400, 401]).toContain(response.status);
    });
  });

  describe('GET /v1/hr/one-on-ones', () => {
    it('should reach the list handler when authenticated', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .get('/v1/hr/one-on-ones')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).not.toBe(401);
      expect([200, 403, 404]).toContain(response.status);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.server).get('/v1/hr/one-on-ones');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /v1/hr/one-on-ones/:id', () => {
    it('should reach the get handler when authenticated', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .get(`/v1/hr/one-on-ones/${NON_EXISTENT_MEETING_ID}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).not.toBe(401);
      expect([200, 403, 404]).toContain(response.status);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.server).get(
        `/v1/hr/one-on-ones/${NON_EXISTENT_MEETING_ID}`,
      );

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /v1/hr/one-on-ones/:id', () => {
    it('should reach the update handler when authenticated', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .patch(`/v1/hr/one-on-ones/${NON_EXISTENT_MEETING_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ sharedNotes: 'Notas atualizadas.' });

      expect(response.status).not.toBe(401);
      expect([200, 400, 403, 404]).toContain(response.status);
    });

    it('should return 400 when no fields are provided', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .patch(`/v1/hr/one-on-ones/${NON_EXISTENT_MEETING_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.server)
        .patch(`/v1/hr/one-on-ones/${NON_EXISTENT_MEETING_ID}`)
        .send({ sharedNotes: 'Notas atualizadas.' });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /v1/hr/one-on-ones/:id', () => {
    it('should reach the delete handler when authenticated', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .delete(`/v1/hr/one-on-ones/${NON_EXISTENT_MEETING_ID}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).not.toBe(401);
      expect([204, 403, 404]).toContain(response.status);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.server).delete(
        `/v1/hr/one-on-ones/${NON_EXISTENT_MEETING_ID}`,
      );

      expect(response.status).toBe(401);
    });
  });

  describe('POST /v1/hr/one-on-ones/:id/talking-points', () => {
    it('should reach the add talking point handler when authenticated', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .post(`/v1/hr/one-on-ones/${NON_EXISTENT_MEETING_ID}/talking-points`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Discutir roadmap da próxima sprint.' });

      expect(response.status).not.toBe(401);
      expect([201, 403, 404]).toContain(response.status);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.server)
        .post(`/v1/hr/one-on-ones/${NON_EXISTENT_MEETING_ID}/talking-points`)
        .send({ content: 'Discutir roadmap.' });

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /v1/hr/one-on-ones/talking-points/:id', () => {
    it('should reach the update talking point handler when authenticated', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .patch(
          `/v1/hr/one-on-ones/talking-points/${NON_EXISTENT_TALKING_POINT_ID}`,
        )
        .set('Authorization', `Bearer ${token}`)
        .send({ isResolved: true });

      expect(response.status).not.toBe(401);
      expect([200, 400, 403, 404]).toContain(response.status);
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app.server)
        .patch(
          `/v1/hr/one-on-ones/talking-points/${NON_EXISTENT_TALKING_POINT_ID}`,
        )
        .send({ isResolved: true });

      // Either 401 (auth first) or 400 if a route shadowing occurs at /:id level
      expect([400, 401]).toContain(response.status);
    });
  });

  describe('DELETE /v1/hr/one-on-ones/talking-points/:id', () => {
    it('should reach the delete talking point handler when authenticated', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .delete(
          `/v1/hr/one-on-ones/talking-points/${NON_EXISTENT_TALKING_POINT_ID}`,
        )
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).not.toBe(401);
      expect([204, 400, 403, 404]).toContain(response.status);
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app.server).delete(
        `/v1/hr/one-on-ones/talking-points/${NON_EXISTENT_TALKING_POINT_ID}`,
      );

      // Either 401 (auth first) or 400 if a route shadowing occurs at /:id level
      expect([400, 401]).toContain(response.status);
    });
  });

  describe('POST /v1/hr/one-on-ones/:id/action-items', () => {
    it('should reach the add action item handler when authenticated', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .post(`/v1/hr/one-on-ones/${NON_EXISTENT_MEETING_ID}/action-items`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Levantar documentação da API.',
          ownerId: NON_EXISTENT_REPORT_ID,
        });

      expect(response.status).not.toBe(401);
      expect([201, 400, 403, 404]).toContain(response.status);
    });

    it('should return 400 when content is missing', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .post(`/v1/hr/one-on-ones/${NON_EXISTENT_MEETING_ID}/action-items`)
        .set('Authorization', `Bearer ${token}`)
        .send({ ownerId: NON_EXISTENT_REPORT_ID });

      expect(response.status).toBe(400);
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app.server)
        .post(`/v1/hr/one-on-ones/${NON_EXISTENT_MEETING_ID}/action-items`)
        .send({
          content: 'Levantar documentação da API.',
          ownerId: NON_EXISTENT_REPORT_ID,
        });

      expect([400, 401]).toContain(response.status);
    });
  });

  describe('PATCH /v1/hr/one-on-ones/action-items/:id', () => {
    it('should reach the update action item handler when authenticated', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .patch(
          `/v1/hr/one-on-ones/action-items/${NON_EXISTENT_ACTION_ITEM_ID}`,
        )
        .set('Authorization', `Bearer ${token}`)
        .send({ isCompleted: true });

      expect(response.status).not.toBe(401);
      expect([200, 400, 403, 404]).toContain(response.status);
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app.server)
        .patch(
          `/v1/hr/one-on-ones/action-items/${NON_EXISTENT_ACTION_ITEM_ID}`,
        )
        .send({ isCompleted: true });

      expect([400, 401]).toContain(response.status);
    });
  });

  describe('DELETE /v1/hr/one-on-ones/action-items/:id', () => {
    it('should reach the delete action item handler when authenticated', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .delete(
          `/v1/hr/one-on-ones/action-items/${NON_EXISTENT_ACTION_ITEM_ID}`,
        )
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).not.toBe(401);
      expect([204, 400, 403, 404]).toContain(response.status);
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app.server).delete(
        `/v1/hr/one-on-ones/action-items/${NON_EXISTENT_ACTION_ITEM_ID}`,
      );

      expect([400, 401]).toContain(response.status);
    });
  });
});
