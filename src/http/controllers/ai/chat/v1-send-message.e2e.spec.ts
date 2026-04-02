import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Send Message (E2E)', () => {
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

  it('should send a message and create a conversation (200)', async () => {
    const response = await request(app.server)
      .post('/v1/ai/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'Ola, tudo bem?',
        context: 'DEDICATED',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('conversationId');
    expect(response.body).toHaveProperty('userMessage');
    expect(response.body).toHaveProperty('assistantMessage');
    expect(response.body.userMessage).toHaveProperty('id');
    expect(response.body.userMessage).toHaveProperty('role');
    expect(response.body.assistantMessage).toHaveProperty('id');
    expect(response.body.assistantMessage).toHaveProperty('role');
  });

  it('should send a message to an existing conversation', async () => {
    const firstResponse = await request(app.server)
      .post('/v1/ai/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'Primeira mensagem',
        context: 'DEDICATED',
      });

    expect(firstResponse.status).toBe(200);
    const conversationId = firstResponse.body.conversationId;

    const secondResponse = await request(app.server)
      .post('/v1/ai/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({
        conversationId,
        content: 'Segunda mensagem',
        context: 'DEDICATED',
      });

    expect(secondResponse.status).toBe(200);
    expect(secondResponse.body.conversationId).toBe(conversationId);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).post('/v1/ai/chat').send({
      content: 'Ola',
      context: 'DEDICATED',
    });

    expect(response.status).toBe(401);
  });
});
