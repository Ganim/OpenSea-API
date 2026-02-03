import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Template (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create template with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/templates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Full Template ${timestamp}`,
        productAttributes: {
          brand: { type: 'string' },
          model: { type: 'string' },
        },
        variantAttributes: {
          color: { type: 'string' },
          size: { type: 'string' },
        },
        itemAttributes: {
          lot: { type: 'string' },
        },
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('template');
    expect(response.body.template).toHaveProperty('id');
    expect(response.body.template).toHaveProperty('name');
  });
});
