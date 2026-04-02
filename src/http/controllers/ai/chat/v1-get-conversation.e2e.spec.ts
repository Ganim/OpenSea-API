import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Get Conversation (E2E)', () => {
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

  it('should get a conversation with messages (200)', async () => {
    // Create a conversation first
    const chatResponse = await request(app.server)
      .post('/v1/ai/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'Mensagem para buscar depois',
        context: 'DEDICATED',
      });

    expect(chatResponse.status).toBe(200);
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
    expect(response.body.messages.length).toBeGreaterThanOrEqual(2);
  });

  it('should return 404 for non-existent conversation', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .get(`/v1/ai/chat/conversations/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect([400, 404]).toContain(response.status);
  });

  it('should return 401 without token', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server).get(
      `/v1/ai/chat/conversations/${fakeId}`,
    );

    expect(response.status).toBe(401);
  });
});
