import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Update Template (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update template with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const createResponse = await request(app.server)
      .post('/v1/templates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Original Template ${timestamp}`,
        productAttributes: {
          color: { type: 'string' },
        },
      });

    const templateId = createResponse.body.template.id;

    const response = await request(app.server)
      .put(`/v1/templates/${templateId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Updated Template ${timestamp}`,
        variantAttributes: {
          sku: { type: 'string' },
        },
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('template');
    expect(response.body.template).toHaveProperty('id', templateId);
    expect(response.body.template).toHaveProperty(
      'name',
      `Updated Template ${timestamp}`,
    );
  });
});
