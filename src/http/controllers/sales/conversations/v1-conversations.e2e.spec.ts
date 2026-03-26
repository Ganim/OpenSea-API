import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Conversations (E2E)', () => {
  let tenantId: string;
  let token: string;
  let customerId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;

    const customer = await prisma.customer.create({
      data: {
        tenantId,
        name: `Conversation Test Customer ${Date.now()}`,
        type: 'INDIVIDUAL',
        isActive: true,
        source: 'MANUAL',
      },
    });
    customerId = customer.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /v1/sales/conversations should create a conversation (201)', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/sales/conversations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId,
        subject: `Conversation ${timestamp}`,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('conversation');
    expect(response.body.conversation).toHaveProperty('id');
    expect(response.body.conversation.subject).toBe(
      `Conversation ${timestamp}`,
    );
  });

  it('GET /v1/sales/conversations should list conversations (200)', async () => {
    const response = await request(app.server)
      .get('/v1/sales/conversations')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('conversations');
    expect(response.body).toHaveProperty('total');
    expect(Array.isArray(response.body.conversations)).toBe(true);
  });

  it('GET /v1/sales/conversations/:id should get conversation by id (200)', async () => {
    const createResponse = await request(app.server)
      .post('/v1/sales/conversations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId,
        subject: `Conversation GetById ${Date.now()}`,
      });

    const conversationId = createResponse.body.conversation.id;

    const response = await request(app.server)
      .get(`/v1/sales/conversations/${conversationId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('conversation');
    expect(response.body.conversation.id).toBe(conversationId);
  });

  it('DELETE /v1/sales/conversations/:id should soft delete a conversation (204)', async () => {
    const createResponse = await request(app.server)
      .post('/v1/sales/conversations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId,
        subject: `Conversation Delete ${Date.now()}`,
      });

    const conversationId = createResponse.body.conversation.id;

    const response = await request(app.server)
      .delete(`/v1/sales/conversations/${conversationId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });
});
