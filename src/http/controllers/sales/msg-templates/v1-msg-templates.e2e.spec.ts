import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Message Templates (E2E)', () => {
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

  it('POST /v1/sales/msg-templates should create a message template (201)', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/sales/msg-templates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Template ${timestamp}`,
        channel: 'EMAIL',
        subject: 'Order Confirmation',
        body: 'Hello {{customerName}}, your order #{{orderNumber}} has been confirmed.',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('messageTemplate');
    expect(response.body.messageTemplate).toHaveProperty('id');
    expect(response.body.messageTemplate.name).toBe(`Template ${timestamp}`);
    expect(response.body.messageTemplate.channel).toBe('EMAIL');
  });

  it('GET /v1/sales/msg-templates should list message templates (200)', async () => {
    const response = await request(app.server)
      .get('/v1/sales/msg-templates')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('messageTemplates');
    expect(response.body).toHaveProperty('total');
    expect(Array.isArray(response.body.messageTemplates)).toBe(true);
  });

  it('GET /v1/sales/msg-templates/:id should get message template by id (200)', async () => {
    const createResponse = await request(app.server)
      .post('/v1/sales/msg-templates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Template GetById ${Date.now()}`,
        channel: 'WHATSAPP',
        body: 'Hello {{name}}, payment reminder.',
      });

    const templateId = createResponse.body.messageTemplate.id;

    const response = await request(app.server)
      .get(`/v1/sales/msg-templates/${templateId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('messageTemplate');
    expect(response.body.messageTemplate.id).toBe(templateId);
  });

  it('DELETE /v1/sales/msg-templates/:id should soft delete a message template (204)', async () => {
    const createResponse = await request(app.server)
      .post('/v1/sales/msg-templates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Template Delete ${Date.now()}`,
        channel: 'NOTIFICATION',
        body: 'Test notification body.',
      });

    const templateId = createResponse.body.messageTemplate.id;

    const response = await request(app.server)
      .delete(`/v1/sales/msg-templates/${templateId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });
});
