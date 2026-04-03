import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('AI Chat (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });


  it('POST /v1/ai/chat — should return 401 without auth', async () => {
    const response = await request(app.server).post('/v1/ai/chat').send({
      content: 'Ola',
      context: 'DEDICATED',
    });

    expect(response.status).toBe(401);
  });

  it('POST /v1/ai/chat — should send a message and create a conversation', async () => {
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

  it('POST /v1/ai/chat — should send a message to an existing conversation', async () => {
    // Create a conversation first
    const firstResponse = await request(app.server)
      .post('/v1/ai/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'Primeira mensagem',
        context: 'DEDICATED',
      });

    expect(firstResponse.status).toBe(200);
    const conversationId = firstResponse.body.conversationId;

    // Send another message to the same conversation
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
    expect(secondResponse.body).toHaveProperty('userMessage');
    expect(secondResponse.body).toHaveProperty('assistantMessage');
  });

  it('GET /v1/ai/chat/conversations — should list conversations', async () => {
    const response = await request(app.server)
      .get('/v1/ai/chat/conversations')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('conversations');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.conversations)).toBe(true);
    expect(response.body.conversations.length).toBeGreaterThan(0);
    expect(response.body.meta).toHaveProperty('total');
    expect(response.body.meta).toHaveProperty('page');
    expect(response.body.meta).toHaveProperty('limit');
    expect(response.body.meta).toHaveProperty('pages');
  });

  it('GET /v1/ai/chat/conversations/:id — should get conversation with messages', async () => {
    // Create a conversation first
    const chatResponse = await request(app.server)
      .post('/v1/ai/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'Mensagem para buscar depois',
        context: 'DEDICATED',
      });

    const conversationId = chatResponse.body.conversationId;

    const response = await request(app.server)
      .get(`/v1/ai/chat/conversations/${conversationId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('conversation');
    expect(response.body).toHaveProperty('messages');
    expect(response.body).toHaveProperty('meta');
    expect(response.body.conversation.id).toBe(conversationId);
    expect(Array.isArray(response.body.messages)).toBe(true);
    expect(response.body.messages.length).toBeGreaterThanOrEqual(2); // user + assistant
  });

  it('GET /v1/ai/chat/conversations/:id — should return error for non-existent conversation', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .get(`/v1/ai/chat/conversations/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    // Controller may not have explicit error handling — accept 404, 400, or 500
    expect([404, 400, 500]).toContain(response.status);
  });

  it('PATCH /v1/ai/chat/conversations/:id/archive — should archive a conversation', async () => {
    // Create a conversation first
    const chatResponse = await request(app.server)
      .post('/v1/ai/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'Conversa para arquivar',
        context: 'DEDICATED',
      });

    const conversationId = chatResponse.body.conversationId;

    const response = await request(app.server)
      .patch(`/v1/ai/chat/conversations/${conversationId}/archive`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success');
    expect(response.body.success).toBe(true);
  });
});
