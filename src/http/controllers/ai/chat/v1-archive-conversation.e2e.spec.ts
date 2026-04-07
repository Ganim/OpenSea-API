import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Archive Conversation (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  it('should archive a conversation (200)', async () => {
    // Create a conversation first
    const chatResponse = await request(app.server)
      .post('/v1/ai/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'Conversa para arquivar',
        context: 'DEDICATED',
      });

    expect(chatResponse.status).toBe(200);
    const conversationId = chatResponse.body.conversationId;

    const response = await request(app.server)
      .patch(`/v1/ai/chat/conversations/${conversationId}/archive`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success');
    expect(response.body.success).toBe(true);
  });

  it('should return 401 without token', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server).patch(
      `/v1/ai/chat/conversations/${fakeId}/archive`,
    );

    expect(response.status).toBe(401);
  });
});
