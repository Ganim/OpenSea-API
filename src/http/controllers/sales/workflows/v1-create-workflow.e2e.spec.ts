import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Workflow (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should create a workflow', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/sales/workflows')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Workflow ${timestamp}`,
        trigger: 'ORDER_CREATED',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('workflow');
    expect(response.body.workflow).toHaveProperty('name');
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/sales/workflows')
      .send({ name: 'No Auth', trigger: 'ORDER_CREATED' });

    expect(response.status).toBe(401);
  });
});
