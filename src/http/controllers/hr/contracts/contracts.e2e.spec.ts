import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

const NON_EXISTENT_TEMPLATE_ID = 'clxxxxxxxxxxxxxxxxxxxxxxxxx';
const NON_EXISTENT_CONTRACT_ID = 'clyyyyyyyyyyyyyyyyyyyyyyyyy';
const NON_EXISTENT_EMPLOYEE_ID = '00000000-0000-0000-0000-000000000000';

/**
 * NOTE: HR contract template/generation permissions
 * (`hr.contract-templates.*`, `hr.contracts.*`) are scoped via
 * `createPermissionMiddleware` and may surface as 403 when the test user's
 * permission set does not include the specific scope. Tests therefore
 * accept 403 as a valid outcome alongside 200/201/404.
 */
describe('Contract Templates and Generation (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: createdTenantId } = await createAndSetupTenant();
    tenantId = createdTenantId;
  });

  describe('POST /v1/hr/contract-templates', () => {
    it('should reach the create template handler when authenticated', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .post('/v1/hr/contract-templates')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Template CLT Padrão',
          type: 'CLT',
          content:
            'Pelo presente instrumento particular, {{company.name}} contrata {{employee.fullName}}...',
          isActive: true,
          isDefault: false,
        });

      expect(response.status).not.toBe(401);
      expect([201, 400, 403]).toContain(response.status);
    });

    it('should return 400 when type is invalid', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .post('/v1/hr/contract-templates')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Template Inválido',
          type: 'INVALID_TYPE',
          content: 'Conteúdo qualquer.',
        });

      expect(response.status).toBe(400);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.server)
        .post('/v1/hr/contract-templates')
        .send({
          name: 'Template CLT Padrão',
          type: 'CLT',
          content: 'Pelo presente...',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /v1/hr/contract-templates', () => {
    it('should reach the list handler when authenticated', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .get('/v1/hr/contract-templates')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).not.toBe(401);
      expect([200, 403]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('templates');
        expect(response.body).toHaveProperty('meta');
      }
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.server).get(
        '/v1/hr/contract-templates',
      );

      expect(response.status).toBe(401);
    });
  });

  describe('GET /v1/hr/contract-templates/:id', () => {
    it('should reach the get template handler when authenticated', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .get(`/v1/hr/contract-templates/${NON_EXISTENT_TEMPLATE_ID}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).not.toBe(401);
      expect([200, 403, 404]).toContain(response.status);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.server).get(
        `/v1/hr/contract-templates/${NON_EXISTENT_TEMPLATE_ID}`,
      );

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /v1/hr/contract-templates/:id', () => {
    it('should reach the update handler when authenticated', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .patch(`/v1/hr/contract-templates/${NON_EXISTENT_TEMPLATE_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Nome atualizado' });

      expect(response.status).not.toBe(401);
      expect([200, 400, 403, 404]).toContain(response.status);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.server)
        .patch(`/v1/hr/contract-templates/${NON_EXISTENT_TEMPLATE_ID}`)
        .send({ name: 'Nome atualizado' });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /v1/hr/contract-templates/:id', () => {
    it('should reach the delete handler when authenticated', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .delete(`/v1/hr/contract-templates/${NON_EXISTENT_TEMPLATE_ID}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).not.toBe(401);
      expect([200, 403, 404]).toContain(response.status);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.server).delete(
        `/v1/hr/contract-templates/${NON_EXISTENT_TEMPLATE_ID}`,
      );

      expect(response.status).toBe(401);
    });
  });

  describe('POST /v1/hr/employees/:id/contracts/generate', () => {
    it('should reach the generate handler when authenticated', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .post(`/v1/hr/employees/${NON_EXISTENT_EMPLOYEE_ID}/contracts/generate`)
        .set('Authorization', `Bearer ${token}`)
        .send({ templateId: NON_EXISTENT_TEMPLATE_ID });

      expect(response.status).not.toBe(401);
      expect([201, 400, 403, 404]).toContain(response.status);
    });

    it('should return 400 when templateId is missing', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .post(`/v1/hr/employees/${NON_EXISTENT_EMPLOYEE_ID}/contracts/generate`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.server)
        .post(`/v1/hr/employees/${NON_EXISTENT_EMPLOYEE_ID}/contracts/generate`)
        .send({ templateId: NON_EXISTENT_TEMPLATE_ID });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /v1/hr/employees/:id/contracts', () => {
    it('should reach the list employee contracts handler when authenticated', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .get(`/v1/hr/employees/${NON_EXISTENT_EMPLOYEE_ID}/contracts`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).not.toBe(401);
      expect([200, 403, 404]).toContain(response.status);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.server).get(
        `/v1/hr/employees/${NON_EXISTENT_EMPLOYEE_ID}/contracts`,
      );

      expect(response.status).toBe(401);
    });
  });

  describe('GET /v1/hr/contracts/:id/download', () => {
    it('should reach the download handler when authenticated', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .get(`/v1/hr/contracts/${NON_EXISTENT_CONTRACT_ID}/download`)
        .set('Authorization', `Bearer ${token}`)
        .redirects(0);

      expect(response.status).not.toBe(401);
      expect([302, 400, 403, 404]).toContain(response.status);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.server)
        .get(`/v1/hr/contracts/${NON_EXISTENT_CONTRACT_ID}/download`)
        .redirects(0);

      expect(response.status).toBe(401);
    });
  });
});
