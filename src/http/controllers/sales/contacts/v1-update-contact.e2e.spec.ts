import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Update Contact (E2E)', () => {
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
        name: `Cust UpdContact ${Date.now()}`,
        type: 'PF',
      },
    });
    customerId = customer.id;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .put('/v1/contacts/00000000-0000-0000-0000-000000000001')
      .send({ firstName: 'Updated' });

    expect(response.status).toBe(401);
  });

  it('should update a contact (200)', async () => {
    const createRes = await request(app.server)
      .post('/v1/contacts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId,
        firstName: `UpdContact ${Date.now()}`,
      });

    const contactId = createRes.body.contact.id;

    const response = await request(app.server)
      .put(`/v1/contacts/${contactId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId,
        firstName: `Updated ${Date.now()}`,
        role: 'INFLUENCER',
      });

    expect(response.status).toBe(200);
    expect(response.body.contact).toBeDefined();
  });
});
