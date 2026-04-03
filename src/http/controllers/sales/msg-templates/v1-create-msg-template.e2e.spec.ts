import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Message Template (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should create a message template', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/sales/msg-templates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Template ${timestamp}`,
        channel: 'EMAIL',
        body: 'Hello {{name}}, your order is ready.',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('messageTemplate');
    expect(response.body.messageTemplate).toHaveProperty('name');
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/sales/msg-templates')
      .send({ name: 'No Auth', channel: 'EMAIL', body: 'Test' });

    expect(response.status).toBe(401);
  });
});
