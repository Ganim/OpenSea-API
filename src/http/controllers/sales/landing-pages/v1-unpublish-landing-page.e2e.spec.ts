import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Unpublish Landing Page (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should unpublish a landing page', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    // Create and publish first
    const createResponse = await request(app.server)
      .post('/v1/sales/landing-pages')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: `Unpublish Page ${timestamp}`,
        slug: `unpublish-page-${timestamp}`,
        template: 'lead-capture',
        content: {},
      });

    const landingPageId = createResponse.body.landingPage.id;

    await request(app.server)
      .patch(`/v1/sales/landing-pages/${landingPageId}/publish`)
      .set('Authorization', `Bearer ${token}`);

    const response = await request(app.server)
      .patch(`/v1/sales/landing-pages/${landingPageId}/unpublish`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('landingPage');
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).patch(
      '/v1/sales/landing-pages/00000000-0000-0000-0000-000000000000/unpublish',
    );

    expect(response.status).toBe(401);
  });
});
