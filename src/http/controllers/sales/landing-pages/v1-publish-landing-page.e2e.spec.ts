import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Publish Landing Page (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should publish a landing page', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const createResponse = await request(app.server)
      .post('/v1/sales/landing-pages')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: `Publish Page ${timestamp}`,
        slug: `publish-page-${timestamp}`,
        template: 'lead-capture',
        content: {},
      });

    const landingPageId = createResponse.body.landingPage.id;

    const response = await request(app.server)
      .patch(`/v1/sales/landing-pages/${landingPageId}/publish`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('landingPage');
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).patch(
      '/v1/sales/landing-pages/00000000-0000-0000-0000-000000000000/publish',
    );

    expect(response.status).toBe(401);
  });
});
