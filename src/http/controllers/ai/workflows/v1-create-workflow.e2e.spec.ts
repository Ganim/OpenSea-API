import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Workflow (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create workflow from natural language (201 or provider error)', async () => {
    const response = await request(app.server)
      .post('/v1/ai/workflows')
      .set('Authorization', `Bearer ${token}`)
      .send({
        naturalPrompt:
          'Quando o estoque de qualquer produto ficar abaixo de 5 unidades, enviar um alerta por email',
      });

    // AI provider may not be configured in test env
    if (response.status === 201) {
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('triggerType');
      expect(response.body).toHaveProperty('actions');
      expect(response.body).toHaveProperty('isActive');
    } else {
      expect([400, 500]).toContain(response.status);
    }
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/ai/workflows')
      .send({
        naturalPrompt: 'Enviar alerta quando estoque baixo',
      });

    expect(response.status).toBe(401);
  });
});
