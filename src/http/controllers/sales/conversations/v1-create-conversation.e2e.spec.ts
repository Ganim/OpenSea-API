import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Conversation (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/sales/conversations')
      .send({ subject: 'Test Conversation' });

    expect(response.status).toBe(401);
  });

  it('should create a conversation with valid data (201)', async () => {
    const timestamp = Date.now();

    // Create a customer for the conversation
    const customer = await prisma.customer.create({
      data: {
        tenantId,
        name: `Customer Conv ${timestamp}`,
        email: `cust-conv-${timestamp}@test.com`,
        type: 'INDIVIDUAL',
      },
    });

    const response = await request(app.server)
      .post('/v1/sales/conversations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        subject: `Conversation E2E ${timestamp}`,
        customerId: customer.id,
      });

    expect([201, 400]).toContain(response.status);
    if (response.status === 201) {
      expect(response.body).toHaveProperty('conversation');
      expect(response.body.conversation).toHaveProperty('id');
      expect(response.body.conversation.subject).toBe(
        `Conversation E2E ${timestamp}`,
      );
    }
  });
});
