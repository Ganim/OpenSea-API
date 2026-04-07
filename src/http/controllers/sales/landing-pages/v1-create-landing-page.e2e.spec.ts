import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Landing Page (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should create a landing page', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/sales/landing-pages')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: `Test Landing Page ${timestamp}`,
        slug: `test-page-${timestamp}`,
        template: 'lead-capture',
        content: {},
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('landingPage');
    expect(response.body.landingPage).toHaveProperty('title');
    expect(response.body.landingPage).toHaveProperty('slug');
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/sales/landing-pages')
      .send({
        title: 'No Auth Page',
        slug: 'no-auth',
        template: 'lead-capture',
        content: {},
      });

    expect(response.status).toBe(401);
  });
});
