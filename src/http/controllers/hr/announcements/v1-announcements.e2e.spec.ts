import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Announcements (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  describe('POST /v1/hr/announcements', () => {
    it('should create an announcement successfully', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .post('/v1/hr/announcements')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Company Town Hall',
          content: 'Monthly town hall meeting scheduled for Friday at 3 PM.',
          priority: 'NORMAL',
          publishNow: true,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('announcement');
      expect(response.body.announcement).toHaveProperty('id');
      expect(response.body.announcement.title).toBe('Company Town Hall');
      expect(response.body.announcement.priority).toBe('NORMAL');
      expect(response.body.announcement.isActive).toBe(true);
    });

    it('should create an URGENT announcement with target departments', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .post('/v1/hr/announcements')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Emergency Notice',
          content: 'All staff must evacuate building B immediately.',
          priority: 'URGENT',
          publishNow: true,
        });

      expect(response.status).toBe(201);
      expect(response.body.announcement.priority).toBe('URGENT');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app.server)
        .post('/v1/hr/announcements')
        .send({
          title: 'Unauthorized Announcement',
          content: 'This should fail.',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /v1/hr/announcements', () => {
    it('should list announcements with pagination', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      // Create an announcement first
      await request(app.server)
        .post('/v1/hr/announcements')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Listing Test Announcement',
          content: 'Created for listing test.',
          priority: 'NORMAL',
          publishNow: true,
        });

      const response = await request(app.server)
        .get('/v1/hr/announcements')
        .set('Authorization', `Bearer ${token}`)
        .query({ page: 1, limit: 20 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('announcements');
      expect(Array.isArray(response.body.announcements)).toBe(true);
      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.meta).toHaveProperty('page');
      expect(response.body.meta).toHaveProperty('limit');
      expect(response.body.meta).toHaveProperty('pages');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app.server).get('/v1/hr/announcements');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /v1/hr/announcements/:id', () => {
    it('should update an announcement successfully', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      // Create an announcement
      const createResponse = await request(app.server)
        .post('/v1/hr/announcements')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Original Title',
          content: 'Original content for update test.',
          priority: 'NORMAL',
          publishNow: true,
        });

      const announcementId = createResponse.body.announcement.id;

      const updateResponse = await request(app.server)
        .put(`/v1/hr/announcements/${announcementId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Updated Title',
          content: 'Updated content.',
          priority: 'IMPORTANT',
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body).toHaveProperty('announcement');
      expect(updateResponse.body.announcement.title).toBe('Updated Title');
      expect(updateResponse.body.announcement.content).toBe('Updated content.');
      expect(updateResponse.body.announcement.priority).toBe('IMPORTANT');
    });

    it('should return 404 for non-existent announcement', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .put('/v1/hr/announcements/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Does not exist' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /v1/hr/announcements/:id', () => {
    it('should delete an announcement successfully', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      // Create an announcement
      const createResponse = await request(app.server)
        .post('/v1/hr/announcements')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'To Be Deleted',
          content: 'This announcement will be deleted.',
          priority: 'NORMAL',
          publishNow: true,
        });

      const announcementId = createResponse.body.announcement.id;

      const deleteResponse = await request(app.server)
        .delete(`/v1/hr/announcements/${announcementId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(deleteResponse.status).toBe(204);
    });

    it('should return 404 for non-existent announcement', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .delete('/v1/hr/announcements/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });
});
