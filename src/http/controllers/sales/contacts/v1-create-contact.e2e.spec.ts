import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Contact (E2E)', () => {
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
        name: `Customer Contact ${Date.now()}`,
        type: 'PF',
      },
    });
    customerId = customer.id;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/contacts')
      .send({ firstName: 'John' });

    expect(response.status).toBe(401);
  });

  it('should create a contact (201)', async () => {
    const response = await request(app.server)
      .post('/v1/contacts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId,
        firstName: `Contact ${Date.now()}`,
        lastName: 'Test',
        email: `contact${Date.now()}@test.com`,
        phone: '11999990000',
        role: 'DECISION_MAKER',
      });

    expect(response.status).toBe(201);
    expect(response.body.contact).toBeDefined();
    expect(response.body.contact).toHaveProperty('id');
  });
});
