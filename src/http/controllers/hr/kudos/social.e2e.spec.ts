import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

const NON_EXISTENT_KUDOS_ID = '00000000-0000-0000-0000-000000000000';
const NON_EXISTENT_REPLY_ID = '00000000-0000-0000-0000-000000000001';

describe('Kudos Social — reactions, replies and pinning (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: createdTenantId } = await createAndSetupTenant();
    tenantId = createdTenantId;
  });

  describe('POST /v1/hr/kudos/:id/reactions (toggle)', () => {
    it('should reach the toggle reaction handler when authenticated', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .post(`/v1/hr/kudos/${NON_EXISTENT_KUDOS_ID}/reactions`)
        .set('Authorization', `Bearer ${token}`)
        .send({ emoji: '🎉' });

      expect(response.status).not.toBe(401);
      expect([200, 400, 404]).toContain(response.status);
    });

    it('should return 400 when emoji is missing', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .post(`/v1/hr/kudos/${NON_EXISTENT_KUDOS_ID}/reactions`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.server)
        .post(`/v1/hr/kudos/${NON_EXISTENT_KUDOS_ID}/reactions`)
        .send({ emoji: '🎉' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /v1/hr/kudos/:id/reactions', () => {
    it('should reach the list reactions handler when authenticated', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .get(`/v1/hr/kudos/${NON_EXISTENT_KUDOS_ID}/reactions`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).not.toBe(401);
      expect([200, 404]).toContain(response.status);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.server).get(
        `/v1/hr/kudos/${NON_EXISTENT_KUDOS_ID}/reactions`,
      );

      expect(response.status).toBe(401);
    });
  });

  describe('POST /v1/hr/kudos/:id/replies', () => {
    it('should reach the create reply handler when authenticated', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .post(`/v1/hr/kudos/${NON_EXISTENT_KUDOS_ID}/replies`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Grande trabalho!' });

      expect(response.status).not.toBe(401);
      expect([201, 400, 404]).toContain(response.status);
    });

    it('should return 400 when content is empty', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .post(`/v1/hr/kudos/${NON_EXISTENT_KUDOS_ID}/replies`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: '' });

      expect(response.status).toBe(400);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.server)
        .post(`/v1/hr/kudos/${NON_EXISTENT_KUDOS_ID}/replies`)
        .send({ content: 'Grande trabalho!' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /v1/hr/kudos/:id/replies', () => {
    it('should reach the list replies handler when authenticated', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .get(`/v1/hr/kudos/${NON_EXISTENT_KUDOS_ID}/replies`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).not.toBe(401);
      expect([200, 404]).toContain(response.status);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.server).get(
        `/v1/hr/kudos/${NON_EXISTENT_KUDOS_ID}/replies`,
      );

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /v1/hr/kudos/replies/:id', () => {
    it('should reach the update reply handler when authenticated', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .patch(`/v1/hr/kudos/replies/${NON_EXISTENT_REPLY_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Conteúdo atualizado.' });

      expect(response.status).not.toBe(401);
      expect([200, 400, 403, 404]).toContain(response.status);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.server)
        .patch(`/v1/hr/kudos/replies/${NON_EXISTENT_REPLY_ID}`)
        .send({ content: 'Conteúdo atualizado.' });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /v1/hr/kudos/replies/:id', () => {
    it('should reach the delete reply handler when authenticated', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .delete(`/v1/hr/kudos/replies/${NON_EXISTENT_REPLY_ID}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).not.toBe(401);
      expect([204, 403, 404]).toContain(response.status);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.server).delete(
        `/v1/hr/kudos/replies/${NON_EXISTENT_REPLY_ID}`,
      );

      expect(response.status).toBe(401);
    });
  });

  describe('POST /v1/hr/kudos/:id/pin', () => {
    it('should reach the pin handler when authenticated', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .post(`/v1/hr/kudos/${NON_EXISTENT_KUDOS_ID}/pin`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).not.toBe(401);
      // 403 when authenticated user has no employee linked to perform the pin action
      expect([200, 403, 404]).toContain(response.status);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.server).post(
        `/v1/hr/kudos/${NON_EXISTENT_KUDOS_ID}/pin`,
      );

      expect(response.status).toBe(401);
    });
  });

  describe('POST /v1/hr/kudos/:id/unpin', () => {
    it('should reach the unpin handler when authenticated', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .post(`/v1/hr/kudos/${NON_EXISTENT_KUDOS_ID}/unpin`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).not.toBe(401);
      // 403 when authenticated user has no employee linked to perform the unpin action
      expect([200, 403, 404]).toContain(response.status);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.server).post(
        `/v1/hr/kudos/${NON_EXISTENT_KUDOS_ID}/unpin`,
      );

      expect(response.status).toBe(401);
    });
  });
});
