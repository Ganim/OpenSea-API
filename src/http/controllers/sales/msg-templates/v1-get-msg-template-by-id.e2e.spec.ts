import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Get Message Template By ID (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should get message template by id', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const createResponse = await request(app.server)
      .post('/v1/sales/msg-templates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Get Template ${timestamp}`,
        channel: 'EMAIL',
        body: 'Hello {{name}}',
      });

    const templateId = createResponse.body.messageTemplate.id;

    const response = await request(app.server)
      .get(`/v1/sales/msg-templates/${templateId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('messageTemplate');
    expect(response.body.messageTemplate.id).toBe(templateId);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).get(
      '/v1/sales/msg-templates/00000000-0000-0000-0000-000000000000',
    );

    expect(response.status).toBe(401);
  });
});
